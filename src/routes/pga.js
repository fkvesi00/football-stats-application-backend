const express = require('express')

const other = require('../controllers/other')
const router = express.Router()

router.post('', other.getPga)

module.exports = router
