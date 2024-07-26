const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const fetchuser = require('../middleware/fetchuser')
const jwttoken = 'thisismysecret'

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
        return res.status(404).json({ message: "User exists" })
    }
    const hashedpassword = await bcrypt.hash(password, 10)
    const newUser = new User({ name: name, email: email, password: hashedpassword })
    await newUser.save()
    return res.status(200).json({ newUser })
})
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        return res.status(404).json({ message: "User does not exist" })
    }
    const cmp = await bcrypt.compare(password, user.password)
    if (!cmp) {
        return res.status(404).json({ message: "Invalid Credentials" })
    }
    const data = {
        user: {
            id: user.id
        }
    }
    const authtoken = jwt.sign(data, jwttoken, { expiresIn: '2h' })
    return res.status(200).json({ data, authtoken })
})

router.get('/profile', fetchuser, async (req, res) => {
    const id = req.user.user.id
    console.log(id)
    try {
        const username = await User.findById({_id:id})
        console.log("username",username)
        return res.status(200).json({"username":username.name})
    } catch (error) {
        console.log("error",error)
    }
})

module.exports = router