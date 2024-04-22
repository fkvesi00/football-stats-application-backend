const express = require('express')

const goals = require('../controllers/goals')
const router = express.Router()

// koji igrac je zabio gol na utakmici
router.post('/matchScorers', goals.scorersOfMatch)

// trazi govole koji su pali na pojedinoj utakmici
router.post('/matchGoals', goals.goalsOfMatch)

// trazi sve golove igraca u svim sezonma za pojednie timove
router.post('/player', goals.allPlayerGoals)

module.exports = router
