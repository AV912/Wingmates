const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')



const app = express()

app.use(cors())

app.use(express.json())


const url = process.env.MONGO_URI  
//console.log(url)

mongoose.connect(url)
mongoose.set('strictQuery', false)



const flightInfoSchema = new mongoose.Schema({
    airline: String,
    flightNumber: String,
    departureAirport: String,
    departureDate: String,
    departureTime: String,
    arrivalAirport: String,
    arrivalDate: String,
    arrivalTime: String,
    airplane: String,
})

flightInfoSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        delete returnedObject.__v
    }
})

const FlightInfo = mongoose.model('FlightInfo', flightInfoSchema)

  

  

app.get('/api/flights', (req, res) => {
    FlightInfo.find({}).then(flights => {
        res.json(flights)
    })
})

app.post('/api/flights', (req, res) => {
    //create a fake flight 
    
    function generateRandomAlphanumeric(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    


    const aircraft = {
        model: 'Boeing 777',
        speed: 645,
    }

    const airportCodes = {
        'MEX': { latitude: 19.4363, longitude: -99.0721 }, // Benito Juárez International Airport, Mexico City
        'CDG': { latitude: 49.0034, longitude: 2.5735 },    // Charles de Gaulle Airport, Paris
        'HND': { latitude: 35.5521, longitude: 139.7798 },  // Tokyo Haneda Airport, Tokyo
        'DEL': { latitude: 28.5562, longitude: 77.1000 },   // Indira Gandhi International Airport, Delhi
        'FRA': { latitude: 50.0333, longitude: 8.5706 },    // Frankfurt Airport, Frankfurt
        'DFW': { latitude: 32.8998, longitude: -97.0403 },  // Dallas/Fort Worth International Airport, Dallas
        'LHR': { latitude: 51.4694, longitude: -0.4543 }    // Heathrow Airport, London
    };

    function selectAirports(airportMap) {
        const airports = Object.keys(airportMap);
        const randomIndex1 = Math.floor(Math.random() * airports.length);
        let randomIndex2;
        
        do {
            randomIndex2 = Math.floor(Math.random() * airports.length);
        } while (randomIndex2 === randomIndex1);
    
        const airport1 = airports[randomIndex1];
        const airport2 = airports[randomIndex2];
    
        return [airport1, airport2];
    }

    const [depAir, arrAir] = selectAirports(airportCodes);

    // Function to calculate the distance between two points using the haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180; // Convert degrees to radians
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    // Function to calculate the time to travel between two airports
    function calculateTravelTime(airport1, airport2, speed) {
        // Retrieve coordinates for the airports
        const coordinates1 = airportCodes[airport1];
        const coordinates2 = airportCodes[airport2];

        // Calculate the distance between the two airports
        const distance = calculateDistance(coordinates1.latitude, coordinates1.longitude, coordinates2.latitude, coordinates2.longitude);
        
        // Convert kilometers to miles
        const distanceInMiles = Math.round(distance * 0.621371);
        // Calculate the time to travel (time = distance / speed)
        const timeInHours = distanceInMiles / speed;

        return timeInHours;
    }

    const timeBetweenAirports = calculateTravelTime(depAir, arrAir, aircraft.speed);

    function pickRandomDepartureAndCalculateArrival(hours) {
        // Get the current date and time in UTC
        const currentDate = new Date();
        const currentYear = currentDate.getUTCFullYear();
        const currentMonth = currentDate.getUTCMonth();

        // Calculate the UTC timestamp for the same day next 3 months
        const threeMonthsFromNow = new Date(Date.UTC(currentYear, currentMonth + 3, 1)); // Next month
        threeMonthsFromNow.setUTCHours(0, 0, 0, 0); // Start of the day

        // Calculate the UTC timestamp for today
        const currentUTC = currentDate.getTime();
        const nextThreeMonthsUTC = threeMonthsFromNow.getTime();

        // Generate a random departure date and time within the next 3 months
        const randomDepartureUTC = currentUTC + Math.random() * (nextThreeMonthsUTC - currentUTC);
        const randomDepartureDate = new Date(randomDepartureUTC);

        // Calculate the arrival time based on the departure time and the specified hours
        const arrivalUTC = randomDepartureUTC + hours * 60 * 60 * 1000;
        const arrivalDate = new Date(arrivalUTC);

        console.log("departure date", randomDepartureDate)
        console.log("arrival date", arrivalDate)


        // Ensure arrival time is not earlier than departure time
        if (arrivalDate < randomDepartureDate) {
            arrivalDate.setTime(arrivalDate.getTime() + 24 * 60 * 60 * 1000); // Add one day
        }

        return [randomDepartureDate, arrivalDate];
    }


    const [depDate, arrDate] = pickRandomDepartureAndCalculateArrival(timeBetweenAirports);



    const fakeFlightInfo = new FlightInfo({
        airline: "American Airlines",
        flightNumber: generateRandomAlphanumeric(6).toUpperCase(),
        departureAirport: depAir,
        arrivalAirport: arrAir,
        airplane: aircraft.model,
        departureDate: depDate.toISOString().split('T')[0],
        departureTime: depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        arrivalDate: arrDate.toISOString().split('T')[0],
        arrivalTime: arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
    })

    fakeFlightInfo.save().then(savedFlight => {
        res.json(savedFlight)
    })

})

app.get('/api/flights/:id', (req, res) => {
    FlightInfo.find({flightNumber: req.params.id}).then(flight => {
        //if flight is not found, return error message
        if (flight.length === 0) {
            res.status(404).send("Flight not found")
        } else {
            res.json(flight)
        }
    })
})

app.delete('/api/flights/:id', (req, res) => {
    FlightInfo.findOneAndDelete({flightNumber: req.params.id}).then(flight => {
        res.json(flight)
    })
})   


const personSchema = new mongoose.Schema({
    uid: String,
    email: String,
    name: String,
    language: String,
    nationality: String,
    age: Number,
    gender: String,
    description: String,
    flights: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlightInfo'
        }
    ]
})

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Person = mongoose.model('Person', personSchema)



app.get('/', (req, res) => {
    res.send("Server is running")
})

app.get('/api/persons', (req, res) => {
    Person.find({}).then(persons => {
        res.json(persons)
    })
})

app.post('/api/persons', (req, res) => {
    const body = req.body
    console.log("posting person", body)
    if(body.uid === undefined) {
        console.log("uid missing")
        return res.status(400).statusMessage("uid missing")
    }

    if (Person.find({uid: body.uid}).length > 0) {
        console.log("person already exists")
        return res.status(400).statusMessage("person already exists")
    }
    const newPerson = new Person({
        uid: body.uid,
        email: body.email,
        name: body.name,
        language: body.language,
        nationality: body.nationality,
        age: Number(body.age),
        gender: body.gender,
        description: body.description,
    })

    newPerson.save().then(savedPerson => {
        res.json(savedPerson)
    })
})

app.get('/api/persons/:id', (req, res) => {
    Person.find({uid: req.params.id}).then(person => {
        res.json(person)
    })
})

app.delete('/api/persons/:id', (req, res) => {
    Person.findOneAndDelete({uid: req.params.id}).then(person => {
        res.json(person)
    })
})


app.put('/api/persons/:id', (req, res) => {
    Person.findOneAndUpdate({uid: req.params.id}, req.body).then(updatedPerson => {
        res.json(updatedPerson)
    })  
})

app.get('/api/persons/:id/flights', (req, res) => {
    Person.find({uid: req.params.id}).populate('flights').then(person => {
        res.json(person[0].flights)
    })
})


app.put('/api/persons/:id/flights', (req, res) => {
    Person.findOne({uid: req.params.id}).then(person => {
        const flightId = req.body.flightId
        person.flights = person.flights.concat(flightId)
        person.save().then(savedPerson => {
            res.json(savedPerson)
        })
    })
})

app.delete('/api/persons/:id/flights', (req, res) => {
    Person.findOne({uid: req.params.id}).then(person => {
        const flightId = req.body.flightId
        person.flights = person.flights.filter(flight => flight !== flightId)
        person.save().then(savedPerson => {
            res.json(savedPerson)
        })
    })
}
)

app.get('/api/persons/withflights/:flightId', (req, res) => {
    //find all persons with flightId in their flights array
    console.log("flightId", req.params.flightId)
    Person.find({}).populate('flights').then(persons => {
        const filteredPersons = persons.filter(person => person.flights.some(flight => flight.flightNumber === req.params.flightId))
        res.json(filteredPersons)
    })

})  


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})