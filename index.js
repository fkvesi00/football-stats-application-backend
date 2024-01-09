const express = require('express')
const cors = require("cors")
/* const { createProxyMiddleware } = require('http-proxy-middleware'); */
const app = express()

const port = 5001

app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}))
app.use(express.json())

const knex=require('knex');



const postgres=knex({
  client: 'pg',
  connection: {
    host : 'database-2.cb404o0cwdlr.eu-central-1.rds.amazonaws.com',
    user : 'postgres',
    password : 'Novalozinka4+',
    database : 'postgres',
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    },
  }
});



/* app.use('/api', createProxyMiddleware({ target: 'https://52.59.252.228:5001/', changeOrigin: true })); */

const clubs = require('./controllers/clubs')
const players = require('./controllers/players')
const matches = require('./controllers/matches')
const goals = require('./controllers/goals')
const teamMatchPlayer = require('./controllers/teamPlayerMatch')
const calculations = require('./controllers/calculations')

//root
app.get('/', (req,res) => res.json('My api is running'))

//pronalazi sve klubove
app.get('/clubs', (req,res) =>{clubs.getClubsList(req,res, postgres)})

//pronadi sve klubove u sezoni
app.post('/clubs/season', (req,res) => {clubs.getClubBySeason(req,res,postgres)})

//trazi utakmice kluba
app.post('/clubs/games', (req,res) => {clubs.getClubGames(req,res,postgres)})

//pronalazi sve igrace
app.get('/players', (req, res) => {players.getPlayersList(req,res,postgres)})

//trazi igrace po klubu(nije ukljucena sezona)
app.post('/players/clubPlayers', (req,res) => {players.getPlayersOfClub(req,res,postgres)})

//trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
app.post('/matches/allMatches', (req,res) => {matches.getMatchesBySeason(req,res,postgres)})

//trazi match po matchID
app.post('/matches/id', (req,res) => {matches.findMatchById(req,res,postgres)})

//koji igrac je zabio gol na utakmici
app.post('/goals/matchScorers', (req,res) => {goals.scorersOfMatch(req,res,postgres)})

//trazi govole koji su pali na pojedinoj utakmici
app.post('/goals/matchGoals',(req,res) => {goals.goalsOfMatch(req,res,postgres)})

//nastupi igraca u svim sezonama
app.post('/players/playerApp', (req,res) => {players.getPlayerAppAllSeasons(req,res,postgres)})

//trazi pojedinog igraca
app.post('/players/player', (req,res) => {players.getPlayer(req,res,postgres)})

//trazi sve golove igraca u svim sezonma za pojednie timove
app.post('/goals/player', (req,res) => {goals.allPlayerGoals(req,res,postgres)})

//dodaj klub
app.post('/clubs/addClub',(req,res) => {clubs.addClub(req,res,postgres)})

//dodaj igraca
app.post('/players/addPlayer', (req,res) => {players.addPlayer(req,res,postgres)})

//dodaj utakmicu
app.post('/matches/addMatch',(req, res) => {matches.addMatch(req,res,postgres)})

//dodaj igraca u klub
app.post('/players/addPlayerToClub',(req,res) => {players.addPlayerToClub(req,res,postgres)})

//pronalazi sve igrace koji su nastupili u pojedinoj utakmici
app.post('/teamPlayerMatch/getApp', (req,res) => {teamMatchPlayer.getTeamMatchPlayer(req, res, postgres)})

//dodaj igrace koji nastupaju na utakmici i njihove golove
app.post('/teamPlayerMatch/addAppGoals', (req,res) => {teamMatchPlayer.addTeamMatchPlayer(req,res,postgres)})

//pronadi vec formatirane matcheve
app.get('/matches/getMatchesFormatted',(req, res) => {matches.getMatchesFormatted(req,res,postgres)})


app.post('/calculations/combined-route',  (req, res) => {calculations.formatMatches(req, res, postgres)});

app.listen(port, ()=>{
  console.log(`Sluša na ${port}`);
})




