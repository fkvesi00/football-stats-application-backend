const express = require('express')
const cors = require('cors')
const routeManager = require('./src/routes/routes')
const db = require('./src/database/connection.js')
require('dotenv').config()

const port = process.env.PORT || 5001
const app = express()

// Use cors middleware with your custom options
app.use(cors({
  origin: [
    'https://main--uma-metkovic.netlify.app',
    'https://www.umametkovic.com',
    'https://umametkovic.com'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
}))

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//routes
app.get('/', (req, res) => res.json('My api is running'))

app.use('/clubs', routeManager.clubRoute)
app.use('/players', routeManager.playerRoute)
app.use('/matches', routeManager.matchesRoute)
app.use('/calculations', routeManager.calculationRoute)
app.use('/teamPlayerMatch', routeManager.teamPlayerMatchRoute)
app.use('/goals', routeManager.goalRoute)


// geetting list of apperances and goals fur jeden club
app.post('/pga', (req, res) => {
  const { seasonid, teamid } = req.body

  db
    .select('player.playerid', 'player.playername')
    .countDistinct('teammatchplayer.matchid as appearances') // Use countDistinct to count only distinct matches
    .count('goal.goalid as goals')
    .from('playerteamseason as pts')
    .join('teammatchplayer', function () {
      this.on('pts.playerid', '=', 'teammatchplayer.playerid').andOn('pts.teamid', '=', 'teammatchplayer.teamid')
    })
    .leftJoin('goal', function () {
      this.on('pts.playerid', '=', 'goal.playerid')
        .andOn('pts.teamid', '=', 'goal.teamid')
        .andOn('teammatchplayer.matchid', '=', 'goal.matchid')
    })
    .join('player', 'pts.playerid', '=', 'player.playerid')
    .where({
      'pts.teamid': teamid,
      'pts.seasonid': seasonid
    })
    .groupBy('player.playerid', 'player.playername')
    .orderBy('goals', 'desc')
    .then(results => {
      res.json(results)
      // Process the results here
    })
    .catch(error => {
      console.error(error)
      res.status(500).json({ error: 'Internal Server Error' })
    })
})

// tablica strijelaca

app.post('/scorers', (req, res) => {
  const { seasonid } = req.body

  db
    .select('player.playerid', 'player.playername', 'team.teamname')
    .countDistinct('teammatchplayer.matchid as appearances')
    .countDistinct('goal.goalid as goals')
    .from('goal')
    .join('teammatchplayer', 'goal.playerid', '=', 'teammatchplayer.playerid')
    .join('player', 'goal.playerid', '=', 'player.playerid')
    .join('team', 'goal.teamid', '=', 'team.teamid')
    .join('match', 'teammatchplayer.matchid', '=', 'match.matchid')
    .where('match.seasonid', '=', seasonid)
    .groupBy('player.playerid', 'player.playername', 'team.teamname')
    .havingRaw('count(DISTINCT goal.goalid) > 0')
    .orderBy('goals', 'desc')
    .limit(20) // Add this line to limit the results to the first 20
    .then(results => {
      res.json(results)
      // Process the results here
    })
    .catch(error => {
      console.error(error)
      res.status(500).json({ error: 'Internal Server Error' })
    })
})

app.listen(port, () => {
  console.log(`Sluša na ${port}`)
})
