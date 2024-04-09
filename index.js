const express = require('express')
const cors = require('cors')
const db = require('./src/database/connection')
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

const clubs = require('./src/controllers/clubs')
const players = require('./src/controllers/players')
const matches = require('./src/controllers/matches')
const goals = require('./src/controllers/goals')
const teamMatchPlayer = require('./src/controllers/teamPlayerMatch')
const calculations = require('./src/controllers/calculations')

// root
app.get('/', (req, res) => res.json('My api is running'))

// pronalazi sve klubove
app.get('/clubs', clubs.getClubsList)

// pronadi sve klubove u sezoni
app.post('/clubs/season', clubs.getClubBySeason)

// trazi utakmice kluba
app.post('/clubs/games', clubs.getClubGames)

// pronalazi sve igrace
app.get('/players', players.getPlayersList)

// trazi igrace po klubu(nije ukljucena sezona)
app.post('/players/clubPlayers', players.getPlayersOfClub)

// trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
app.post('/matches/allMatches', matches.getMatchesBySeason)

// trazi match po matchID
app.post('/matches/id', matches.findMatchById)

// koji igrac je zabio gol na utakmici
app.post('/goals/matchScorers', goals.scorersOfMatch)

// trazi govole koji su pali na pojedinoj utakmici
app.post('/goals/matchGoals', goals.goalsOfMatch)

// nastupi igraca u svim sezonama
app.post('/players/playerApp', players.getPlayerAppAllSeasons)

// trazi pojedinog igraca
app.post('/players/player', players.getPlayer)

// trazi sve golove igraca u svim sezonma za pojednie timove
app.post('/goals/player', goals.allPlayerGoals)

// dodaj klub
app.post('/clubs/addClub', clubs.addClub)

// dodaj igraca
app.post('/players/addPlayer', players.addPlayer)

// dodaj utakmicu
app.post('/matches/addMatch', matches.addMatch)

// dodaj igraca u klub
app.post('/players/addPlayerToClub', players.addPlayerToClub)

// pronalazi sve igrace koji su nastupili u pojedinoj utakmici
app.post('/teamPlayerMatch/getApp',teamMatchPlayer.getTeamMatchPlayer)

// dodaj igrace koji nastupaju na utakmici i njihove golove
app.post('/teamPlayerMatch/addAppGoals',teamMatchPlayer.addTeamMatchPlayer)

// pronadi vec formatirane matcheve
app.get('/matches/getMatchesFormatted',matches.getMatchesFormatted)

app.post('/calculations/formatedTable',calculations.formatedTable)

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
