//change name of fucntion to fetch matches by season and tournamentid
const getMatchesBySeason = (req, res, postgres) => {
  const { seasonID, tournamentid } = req.body;

  postgres('teamplayingmatch')
    .select(
      'match.matchid', 
      'team.teamname', 
      'match.score', 
      'teamplayingmatch.home', 
      'match.date', 
      'match.time', 
      'team.teamid'
    )
    .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
    .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
    .where('match.seasonid', seasonID)          // Direct match on seasonID
    .andWhere('match.tournamentid', tournamentid)  // Direct match on tournamentid
    .then(data => res.json(data))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Unable to retrieve matches' });
    });
};

  const findMatchById = (req,res,postgres) => {
    const {matchID} = req.body;
  
    postgres('teamplayingmatch')
        .select('match.matchid', 'team.teamid', 'teamname', 'logo', 'date', 'time', 'score', 'home')
        .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
        .join('match', 'match.matchid', '=', 'teamplayingmatch.matchid')
        .where('match.matchid', matchID)
        .then(data => res.json(data))
        .catch(err => console.log(err))
  }
  
  const addMatch = async (req, res, postgres) => {
    const { MatchID, Date, Time, Home, Score, Away, tournamentID } = req.body;
    console.log(MatchID, Date, Time, Home, Score, Away, tournamentID);
  
    const matchData = {
      matchid: Number(MatchID),
      date: Date,
      time: Time,
      score: null,
      seasonid: 1,
      tournamentid: tournamentID,
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
  }
  
  const getMatchesFormatted = async (req,res, postgres) =>{
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
  }


const getMatchesFormattedLastMatchDay = async (req, res, postgres) => {
  const seasonID = 1;

  try {
    // Fetch the last 6 match IDs
    const lastMatchIDs = await postgres('match')
      .select('matchid')
      .where('seasonid', seasonID)
      .orderBy('matchid', 'desc')
      .limit(6);

    const matchIDs = lastMatchIDs.map((row) => row.matchid);

    // Fetch the details of matches using the last 6 match IDs
    const matchDetails = await postgres('teamplayingmatch')
      .select(
        'match.matchid',
        'team.teamname',
        'match.score',
        'teamplayingmatch.home',
        'match.date',
        'match.time',
        'team.teamid'
      )
      .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
      .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
      .whereIn('match.matchid', matchIDs);

    const formattedData = matchFormat(matchDetails);
    res.json(formattedData);
  } catch (err) {
    console.error(err);
    // Handle errors as needed
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const matchFormat = (utakmica) => {
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
          a_id: awayTeam.teamid,
        };

        matches1.push(match);
      }
    }
  });

  return matches1;
};
  
  
  module.exports = {
      getMatchesBySeason,
      getMatchesFormatted,
      findMatchById,
      addMatch
  }