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

const clubs = require('./controllers/clubs')
const players = require('./controllers/players')
const matches = require('./controllers/matches')
const goals = require('./controllers/goals')

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
app.post('/matches/:id', (req,res) => {matches.findMatchById(req,res,postgres)})

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

//dodaj igrace koji nastupaju na utakmici i njihove golove
app.post('/addTeamMatchPlayer', async (req,res) => {
  const {matchid, hometeamid, awayteamid, homePlayersIds, awayPlayersIds, homeScore, awayScore} = req.body

   console.log(matchid,hometeamid,awayteamid,homePlayersIds,awayPlayersIds,homeScore,awayScore)
   const score = `${homeScore}:${awayScore}`;

// Use a transaction
postgres.transaction(async (trx) => {
  try {
    // Step 1: Update the `score` column in the `match` table
    await trx('match')
      .where('matchid', matchid)
      .update({
        score: score
      });

    console.log('Score updated successfully');

    // Step 2: Insert into `teamplayingmatch` for home team players
    await insertPlayersData(trx, matchid, hometeamid, homePlayersIds);

    // Step 3: Insert into `teamplayingmatch` for away team players
    await insertPlayersData(trx, matchid, awayteamid, awayPlayersIds);

    // If all steps are successful, commit the transaction
    await trx.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    // If an error occurs, rollback the transaction
    await trx.rollback();
    console.error('Transaction failed:', error);
  }
});

// Function to insert players data into `teammatchplayer` and `goal` tables
async function insertPlayersData(trx, matchid, teamid, playersData) {
  

  for (const player of playersData) {
    // Insert into `teampmatchplayer`
    await trx('teammatchplayer').insert({
      matchid: matchid,
      teamid: teamid,
      playerid: player.playerid
    });

    console.log('Inserted into teamplayingmatch successfully');

    // Insert into `goal` multiple times based on the number of goals
    for (let i = 0; i < parseInt(player.goals); i++) {
      await trx('goal').insert({
        matchid: matchid,
        playerid: player.playerid,
        teamid: teamid,
        timeofgoal:1
      });

      console.log('Inserted into goal successfully');
    }
  }
}
 /* const score = `${homeScore}:${awayScore}`
  
  // Step 1: Update the `score` column in the `match` table
  postgres('match')
    .where('matchid',matchid)
    .update({
      score:score
    })
    .then(() => {
      console.log('Score updated successfully');
    })
    .catch((error) => {
      console.error('Error updating score:', error);
    })
  
    // Step 2: Insert records into the `teamplayingmatch` table
    const insertTeamPlayingMatch = async (matchid, clubid, playerid) => {
      playerid=Number(playerid)
      try {
        await postgres('teammatchplayer').insert({
          matchid,
          playerid,
          teamid:clubid,
        });
        console.log(`Record inserted successfully for matchid ${matchid}, clubid ${clubid}, playerid ${playerid}`);
      } catch (error) {
        console.error('Error inserting record:', error);
      }
    };
    
    // Insert records for home team players
    for (const playerid of homePlayersIds) {
      insertTeamPlayingMatch(matchid, hometeamid, playerid);
    }
    
    // Insert records for away team players
    for (const playerid of awayPlayersIds) {
      insertTeamPlayingMatch(matchid, awayteamid, playerid);
    } */
    
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


app.listen(port, ()=>{
  console.log(`Sluša na ${port}`);
})

/* app.post('/teamBySeason', (req,res) =>{
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
  
}) */

/* //trazi sve igrace, koji su nastupili za neki klub(nebitno sezona)
app.get('/playerTeam', (req,res) => {
  postgres('player')
  .select('player.playername', 'team.teamname')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .join('team', 'team.teamid', '=', 'playerteam.teamid')
  .then(data => res.json(data))
  .catch(err => console.log(err));
}) */

 /* 
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
}) */

//trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
/* app.post('/matchesBySeason', (req,res) => {
  const {seasonID} = req.body;
  postgres('teamplayingmatch')
  .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid')
  .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
  .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
  /* .whereIn('seasonid', function() {
    this.select('seasonid').from('match').where('seasonid', seasonID);
  }) 
  .then(data => res.json(data))
  .catch(err=> console.log(err));
}) 
*/

//trazi match po mathID
/* app.post('/specificMatch', (req, res) => {
  const {matchID} = req.body;
  postgres('teamplayingmatch')
      .select('match.matchid', 'team.teamid', 'teamname', 'logo', 'date', 'time', 'score', 'home')
      .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
      .join('match', 'match.matchid', '=', 'teamplayingmatch.matchid')
      .where('match.matchid', matchID)
      .then(data => res.json(data))
      .catch(err => console.log(err))
})
   */

//trazi govole koji su pali na pojedinoj utakmici
/* app.post('/matchGoals' , (req,res) => {
  const {matchID} = req.body
  postgres.select('*')
  .from('goal')
  .where('matchid', '=', matchID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
}) */

/* //nastupi igraca u svim sezonama 
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
 */

//trazi pojedinog igraca
/* app.post('/player', (req,res) => {
  const {playerID} = req.body
  postgres.select('*')
  .from('player')
  .where('playerid', playerID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
})
 */

//trazi sve golove igraca u svim sezonma za pojednie timove
/* app.post('/playerGoals', (req,res) => {
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
}) */

/* 
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
 */

/* app.post('/addPlayer', async (req, res) => {
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
}); */


/* app.post('/addMatch', async (req, res) => {
  const { MatchID, Date, Time, Home, Score, Away } = req.body;
  console.log(MatchID, Date, Time, Home, Score, Away);

  const matchData = {
    matchid: Number(MatchID),
    date: Date,
    time: Time,
    score: null,
    seasonid: 1,
  };
  console.log(typeof Date, typeof Time);

  const homeTeamData = {
    TeamName: Number(Home), // Replace with actual team name
  };

  const awayTeamData = {
    TeamName: Number(Away), // Replace with actual team name
  };

  postgres.transaction(async (trx) => {
    try {
      // Insert data into the "Match" relation
      const [matchObject] = await trx('match').insert(matchData).returning('matchid');
      const matchId = matchObject.matchid;

      // Insert data into the "teamplayingmatch" relation for the "Home" team
      await trx('teamplayingmatch').insert({
        matchid: matchId,
        teamid: homeTeamData.TeamName, // Insert the "Home" team ID (if you have it)
        home: true,
      });

      // Insert data into the "teamplayingmatch" relation for the "Away" team
      await trx('teamplayingmatch').insert({
        matchid: matchId,
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
}); */

/* app.post('/addPlayerToClub', async (req,res) => {
    const {playerid, teamid, seasonid} = req.body
    
    postgres.transaction((trx) => {
      return trx
        .insert({ playerid, teamid })
        .into('playerteam')
        .then(() => {
          return trx
            .insert({ playerid, teamid, seasonid })
            .into('playerteamseason');
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
      .then(() => {
        console.log('Transaction complete. Data inserted successfully. Player is added to club');
      })
      .catch((err) => {
        console.error('Error inserting data:', err);
      })
}) */

/* app.get('/getMatches', async (req,res) => {
  const seasonID= 1
  postgres('teamplayingmatch')
  .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid')
  .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
  .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
  .where('match.seasonid', seasonID) // Add the condition for seasonid
  .where('match.score', null)  // Add the condition for score
  .then(data => {
    const formattedData = matchFormat(data);
    res.json(formattedData);
  })
  .catch(err => {
    console.log(err);
    // Handle errors as needed
  });

  

  const matchFormat = utakmica => {
    const matches1 = [];
  
    utakmica.forEach((utakmica2, j) => {
      for (let i = j + 1; i < utakmica.length; i++) {
        if (utakmica2.matchid === utakmica[i].matchid) {
          const homeTeam = utakmica2.home ? utakmica2 : utakmica[i];
          const awayTeam = utakmica2.home ? utakmica[i] : utakmica2;
  
          const match = {
            match_id: utakmica2.matchid,
            date: utakmica2.date,
            time: utakmica2.time,
            h_team: homeTeam.teamname,
            h_id: homeTeam.teamid,
            score: utakmica2.score,
            a_team: awayTeam.teamname,
            a_id: awayTeam.teamid
          };
          
          matches1.push(match);
        }
      }
    });
  
    return matches1;
  }; 
}) */

 

