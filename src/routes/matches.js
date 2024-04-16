const express = require('express')

const matches = require('../controllers/matches')
const router = express.Router()

// trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
router.post('/allMatches', matches.getMatchesBySeason)

// trazi match po matchID
router.post('/id', matches.findMatchById)

// dodaj utakmicu
router.post('/addMatch', matches.addMatch)

// pronadi vec formatirane matcheve
router.get('/getMatchesFormatted', matches.getMatchesFormatted)

module.exports = router
