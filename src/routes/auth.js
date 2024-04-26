const express = require('express')

const auth = require('../controllers/auth')
const router = express.Router()

router.post('/login', auth.login)
router.post('/createUser', auth.createUser)
router.get('/users', auth.getUsers)

module.exports = router
