const express = require('express')

const players = require('../controllers/players')
const router = express.Router()

// pronalazi sve igrace
router.get('', players.getPlayersList)

// trazi igrace po klubu(nije ukljucena sezona)
router.post('/clubPlayers', players.getPlayersOfClub)

// nastupi igraca u svim sezonama
router.post('/playerApp', players.getPlayerAppAllSeasons)

// trazi pojedinog igraca
router.post('/player', players.getPlayer)

// dodaj igraca
router.post('/addPlayer', players.addPlayer)

// dodaj igraca u klub
router.post('/addPlayerToClub', players.addPlayerToClub)

module.exports = router
