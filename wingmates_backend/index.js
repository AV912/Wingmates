const getRandomFutureDayAndTimes = require('./FlightDate.js')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')



const app = express()

app.use(cors())

app.use(express.json())


const url = process.env.MONGO_URI  
console.log(url)

mongoose.connect(url)
mongoose.set('strictQuery', false)



const flightInfoSchema = new mongoose.Schema({
    airline: String,
    flightNumber: String,
    departureAirport: String,
    departureDate: String,
    departureTime: String,
    arrivalAirport: String,
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
    function getRandomElement(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }
    
    function generateRandomAlphanumeric(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    
    const flightTime = getRandomFutureDayAndTimes()
    const airlines = ['American'];
    const departureAirports = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW'];
    const arrivalAirports = ['SFO', 'DEN', 'SEA', 'MIA', 'LAS'];
    const airplanes = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Embraer E190', 'Airbus A380'];
  
    const fakeFlightInfo = new FlightInfo({
        airline: getRandomElement(airlines),
        flightNumber: generateRandomAlphanumeric(6).toUpperCase(),
        departureAirport: getRandomElement(departureAirports),
        arrivalAirport: getRandomElement(arrivalAirports),
        airplane: getRandomElement(airplanes),
        departureDate: flightTime.randomDay,
        departureTime: flightTime.randomTime1,
        arrivalTime: flightTime.randomTime2,
    })

    fakeFlightInfo.save().then(savedFlight => {
        res.json(savedFlight)
    })

})

app.get('/api/flights/:id', (req, res) => {
    FlightInfo.find({flightNumber: req.params.id}).then(flight => {
        res.json(flight)
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


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})