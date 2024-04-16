const express = require('express')

const clubs = require('../controllers/clubs')
const router = express.Router()

// pronalazi sve klubove
router.get('', clubs.getClubsList)

// pronadi sve klubove u sezoni
router.post('/season', clubs.getClubBySeason)

// trazi utakmice kluba
router.post('/games', clubs.getClubGames)

// dodaj klub
router.post('/addClub', clubs.addClub)

module.exports = router
