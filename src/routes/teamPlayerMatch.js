const express = require('express')

const teamMatchPlayer = require('../controllers/teamPlayerMatch')
const router = express.Router()

// pronalazi sve igrace koji su nastupili u pojedinoj utakmici
router.post('/getApp', teamMatchPlayer.getTeamMatchPlayer)

// dodaj igrace koji nastupaju na utakmici i njihove golove
router.post('/addAppGoals', teamMatchPlayer.addTeamMatchPlayer)

module.exports = router
