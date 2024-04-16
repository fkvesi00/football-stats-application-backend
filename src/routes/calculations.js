const express = require('express')

const calculations = require('../controllers/calculations')
const router = express.Router()

router.post('/formatedTable', calculations.formatedTable)

module.exports = router
