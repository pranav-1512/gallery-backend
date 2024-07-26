const mongoose = require('mongoose')

const connectTodb = ()=>{

    mongoose.connect("mongodb+srv://admin:admin@cluster0.k08td3s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    const con = mongoose.connection
    
    con.on('open',()=>{
        console.log("Connected to db")
    })
}
    
module.exports = connectTodb