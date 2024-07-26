const express = require('express')
const connectTodb = require('./config/db')
const auth = require('./routes/auth')
const images = require('./routes/images')
const app = express()
const PORT = 5000
const cors = require('cors')

app.use(cors())
// app.use(cors(
//     {
//         origin: [],
//         methods: ["POST","GET"],
//         credentials: true
//     }
// ))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', auth)
app.use('/api',images)
connectTodb()
app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`)
})