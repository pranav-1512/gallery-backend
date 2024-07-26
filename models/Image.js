const mongoose = require('mongoose')

const ImageSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'UserSchema',
        required:true
    },
    filename:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    tag:{
        type:String
    },
    uploadDate:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model("Image",ImageSchema)