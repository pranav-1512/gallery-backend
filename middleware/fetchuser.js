const jwt = require('jsonwebtoken')
const secret = 'thisismysecret'

const fetchuser = (req, res, next) => {
    const token = req.header('Authorization')
    if (!token) {
        return res.status(404).json({ "msg": "Please login" })
    }
    try {
        const user = jwt.verify(token, secret)
        console.log('user', user)
        req.user = user
        next()
    } catch (error) {
        console.log("error",error)
        return res.status(404).json({ "msg": "Please login" })
    }
}
module.exports = fetchuser