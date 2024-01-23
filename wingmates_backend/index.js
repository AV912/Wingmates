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

const personSchema = new mongoose.Schema({
    uid: String,
    email: String,
    name: String,
    language: String,
    nationality: String,
    age: Number,
    gender: String,
    description: String,
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
    console.log("posting person")
    const body = req.body
    if(body.uid === undefined) {
        return res.status(400).json({error: 'content missing'})
    }
    if (Person.find({uid: body.uid}) !== null) {
        return res.status(400).json({error: 'person already exists'})
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})