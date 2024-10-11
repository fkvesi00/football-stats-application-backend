const express = require('express');
const cors = require('cors');
const app = express();

const port = 5001;

// Use cors middleware with your custom options
app.use(cors({
  origin: [
    'https://main--uma-metkovic.netlify.app',
    'https://www.umametkovic.com',
    'https://umametkovic.com',
    'http://localhost:3000'
  ], 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204,
}));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const knex = require('knex');
const postgres = knex({
  client: 'pg',
  connection: {
    host: 'database-2.cb404o0cwdlr.eu-central-1.rds.amazonaws.com',
    user: 'postgres',
    password: 'Novalozinka4+',
    database: 'postgres',
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});


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


app.post('/calculations/formatedTable',  (req, res) => {calculations.formatedTable(req, res, postgres)});

//geetting list of apperances and goals fur jeden club
app.post('/pga', (req, res) => {
  const { seasonid, teamid } = req.body;

  postgres
    .select('player.playerid', 'player.playername')
    .countDistinct('teammatchplayer.matchid as appearances') // Count distinct matches
    .count('goal.goalid as goals') // Count total goals
    .from('playerteamseason as pts')
    .innerJoin('teammatchplayer', function() {
      this.on('pts.playerid', '=', 'teammatchplayer.playerid')
          .andOn('pts.teamid', '=', 'teammatchplayer.teamid');
    })
    .leftJoin('goal', function() {
      this.on('teammatchplayer.playerid', '=', 'goal.playerid')
          .andOn('teammatchplayer.teamid', '=', 'goal.teamid')
          .andOn('teammatchplayer.matchid', '=', 'goal.matchid'); // Ensure the match and player ID are the same
    })
    .join('player', 'pts.playerid', '=', 'player.playerid')
    .join('match', 'teammatchplayer.matchid', '=', 'match.matchid') // Join match to filter by season
    .where({
      'pts.teamid': teamid,
      'match.seasonid': seasonid // Filter by season using match.seasonid
    })
    .groupBy('player.playerid', 'player.playername')
    .orderBy('goals', 'desc') // Order by goals
    .then(results => {
      res.json(results);
    })
    .catch(error => {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});




//tablica strijelaca
app.post('/scorers', (req, res) => {
  const { seasonid } = req.body;

  postgres
    .select('player.playerid', 'player.playername', 'team.teamname')
    .countDistinct('teammatchplayer.matchid as appearances') // Count distinct appearances for the given season
    .countDistinct('goal.goalid as goals') // Count distinct goals for the given season
    .from('goal')
    .join('match', 'goal.matchid', '=', 'match.matchid') // Join goal to match to filter by season
    .join('teammatchplayer', function() {
      this.on('goal.playerid', '=', 'teammatchplayer.playerid')
          .andOn('goal.matchid', '=', 'teammatchplayer.matchid'); // Ensure the match is the same for goal and appearance
    })
    .join('player', 'goal.playerid', '=', 'player.playerid')
    .join('team', 'goal.teamid', '=', 'team.teamid')
    .where('match.seasonid', '=', seasonid) // Filter goals and appearances by the given season
    .groupBy('player.playerid', 'player.playername', 'team.teamname')
    .havingRaw('count(DISTINCT goal.goalid) > 0') // Only include players with at least 1 goal
    .orderBy('goals', 'desc')
    .limit(20) // Limit results to 20
    .then(results => {
      res.json(results);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});




//ispis koji port slusa aplikaciju
app.listen( port, ()=>{
  console.log(`Sluša na ${port}`);
})