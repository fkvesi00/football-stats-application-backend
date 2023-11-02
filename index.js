const express = require('express')
const app = express()

const port = 3000
const cors = require("cors")

app.use(express.static('public'));
app.use(express.urlencoded({extended:false}))
app.use(express.json())

const knex=require('knex');


const postgres=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'lozinka',
    database : 'UMA_Metkovic'
  }
});


app.use(cors())

//pronalazi sve klubove
app.get('/clubs', function (req, res) {
  postgres.select('*').from('team').then(data => res.json(data))
  .catch(err => console.log(err));
})

//pronalazi sve igrace
app.get('/players', (req,res) => {
  postgres.select('*').from('player').then(data => res.json(data))
  .catch(err => console.log(err));
})

//pronadi sve klubove u sezoni
app.post('/teamBySeason', (req,res) =>{
  const {seasonID} = req.body
  postgres
  .distinct('team.teamname', 'team.teamid')
  .from('team')
  .join('teamplayingmatch', 'team.teamid', 'teamplayingmatch.teamid')
  .whereIn(
    'matchid',
    postgres('match').select('matchid').where('seasonid', seasonID)
  )
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//trazi sve igrace, koji su nastupili za neki klub(nebitno sezona)
app.get('/playerTeam', (req,res) => {
  postgres('player')
  .select('player.playername', 'team.teamname')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .join('team', 'team.teamid', '=', 'playerteam.teamid')
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi igrace po klubu(nije ukljucena sezona)
app.post('/players', (req,res)=>{
  const {teamID} = req.body
  postgres('player')
  .select('*')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .where('playerteam.teamid', teamID)
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi sve utakmice pojedinog kluba
app.post('/clubGames', (req,res) => {
  const {teamID} = req.body;
  postgres('teamplayingmatch')
  .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid' )
  .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
  .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
  .whereIn('match.matchid', function() {
    this.select('matchid').from('teamplayingmatch').where('teamid', teamID);
  })
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
app.post('/matchesBySeason', (req,res) => {
  const {seasonID} = req.body;
  postgres('teamplayingmatch')
  .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid')
  .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
  .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
  /* .whereIn('seasonid', function() {
    this.select('seasonid').from('match').where('seasonid', seasonID);
  }) */
  .then(data => res.json(data))
  .catch(err=> console.log(err));
})

//pronalazi sve igrace koji su nastupili u pojedinoj utakmici                                            (nismo dodali sezonu a mozda i ne moramo vidi cemo)
app.post('/teamMatchPlayer', (req, res) => {
  const {matchID} = req.body;
  postgres('teammatchplayer')
  .select('matchid', 'team.teamid', 'teamname', 'playername', 'player.playerid')
  .join('player', 'teammatchplayer.playerid', '=', 'player.playerid')
  .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
  .where('matchid', matchID)
  .then( data => res.json(data))
  .catch(err => console.log(err));
})

//koji igrac je zabio gol na utakmici
app.post('/scorers', (req, res) => {
  const {matchID} = req.body;
  postgres('goal').select('*').where('matchid', matchID)
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi match po mathID
app.post('/specificMatch', (req, res) => {
  const {matchID} = req.body;
  postgres('teamplayingmatch')
      .select('match.matchid', 'team.teamid', 'teamname', 'logo', 'date', 'time', 'score', 'home')
      .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
      .join('match', 'match.matchid', '=', 'teamplayingmatch.matchid')
      .where('match.matchid', matchID)
      .then(data => res.json(data))
      .catch(err => console.log(err))
})
  
//trazi govole koji su pali na pojedinoj utakmici
app.post('/matchGoals' , (req,res) => {
  const {matchID} = req.body
  postgres.select('*')
  .from('goal')
  .where('matchid', '=', matchID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//nastupi igraca u svim sezonama 
app.post('/playerStats', (req,res) => {
  const {playerID} = req.body
  postgres.select('seasonname', 'teamname')
  .count('playername as app')
  .select('team.teamid', 'season.seasonid')
  .from('player')
  .join('teammatchplayer', 'player.playerid', '=', 'teammatchplayer.playerid')
  .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
  .join('match', 'match.matchid', '=', 'teammatchplayer.matchid')
  .join('season', 'match.seasonid', '=', 'season.seasonid')
  .where('player.playerid', playerID)
  .groupBy('seasonname', 'teamname', 'team.teamid', 'season.seasonid')
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//trazi pojedinog igraca
app.post('/player', (req,res) => {
  const {playerID} = req.body
  postgres.select('*')
  .from('player')
  .where('playerid', playerID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//trazi sve golove igraca u svim sezonma za pojednie timove
app.post('/playerGoals', (req,res) => {
  const {playerID} = req.body
  postgres
  .select('goal.playerid', 'goal.teamid', 'match.seasonid')
  .count('goal.goalid as goals')
  .from('goal')
  .join('match', 'goal.matchid', 'match.matchid')
  .where('goal.playerid', playerID)
  .groupBy('goal.teamid', 'match.seasonid', 'goal.playerid')
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

app.post('/addClub', async (req, res) => {
  const { clubID, teamName } = req.body;
  console.log(typeof clubID, typeof teamName)
  // Check if the parameters are of the proper type
  if (typeof clubID !== 'number' || typeof teamName !== 'string') {
    return res.status(400).json({ error: 'Invalid data types' });
  }

  // Create a new club record in the database
  try {
    const tableName = 'team'
    const teamData = {
      teamid: clubID, // Replace with your teamID
      teamname: teamName, // Replace with your teamname
    };

    postgres(tableName).insert(teamData).then(() => console.log('Data inserted successfully'))
    .finally(() => {
      postgres.destroy(); // Close the database connection when done
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save to the database' });
  }
});


app.post('/addPlayer', async (req, res) => {
  const { playerID, playerName, playerBirth, playerNationality } = req.body;
  

  console.log(typeof playerID, typeof playerName, typeof playerBirth, typeof playerNationality )
   // Check if the parameters are of the proper type
  if (typeof playerID !== 'number' || typeof playerName !== 'string' || typeof playerBirth !== 'string' || typeof playerNationality !== 'string') {
    return res.status(400).json({ error: 'Invalid data types' });
  }

  // Create a new club record in the database
  try {
    const tableName = 'player'
    const teamData = {
      playerid: playerID, 
      playername: playerName, 
      playerbirth: playerBirth, 
      playernationality: playerNationality
    };

    postgres(tableName).insert(teamData).then(() => console.log('Data inserted successfully'))
    .finally(() => {
      postgres.destroy(); // Close the database connection when done
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save to the database' });
  }
});


app.post('/addMatch', async (req, res) => {
  const {MatchID, Date, Time, Home, Score, Away} = req.body;
    console.log(MatchID,Date,Time,Home,Score,Away)

    const matchData = {
      matchid:parseInt(MatchID, 10),
      date: Date,
      time: Time,
      score: null,
      seasonid: 1
    };
    console.log(typeof Date, typeof Time)

    const homeTeamData = {
      TeamName: parseInt(Home, 10), // Replace with actual team name
    };
    
    const awayTeamData = {
      TeamName: parseInt(Away, 10), // Replace with actual team name
    };

    postgres.transaction(async (trx) => {
      try {
        // Insert data into the "Match" relation
        const matchId = await trx('match').insert(matchData);
        console.log('This part success')
        // Insert data into the "teamplayingmatch" relation for the "Home" team
       await trx('teamplayingmatch').insert({
        matchid: matchData.matchid,
        teamid: homeTeamData.TeamName, // Insert the "Home" team ID (if you have it)
        home: true,
      });

      // Insert data into the "teamplayingmatch" relation for the "Away" team
      await trx('teamplayingmatch').insert({
        matchid: matchData.matchid,
        teamid: awayTeamData.TeamName, // Insert the "Away" team ID (if you have it)
        home: false,
      });
    
        // Commit the transaction
        await trx.commit();
    
        console.log('Transaction successful');
      } catch (error) {
        // Rollback the transaction in case of an error
        await trx.rollback();
        console.error('Transaction failed:', error);
      }
    });

})

app.listen(port, ()=>{
  console.log(`Sluša na ${port}`);
}) 

