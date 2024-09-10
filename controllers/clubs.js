const getClubsList = async (req, res, postgres) => {
  try {
    // Pronalazi sve klubove
    const data = await postgres.select('*').from('team');
    
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getClubGames = (req, res, postgres) => {
  const { teamID, seasonid } = req.body;

  postgres('teamplayingmatch as tp1')
    .select(
      'match.matchid as MatchID',
      'match.date as Date',
      'match.time as Time',    // Assuming match table has a `time` column
      'team1.teamid as Team1ID',
      'team1.teamname as Team1Name',
      'team2.teamid as Team2ID',
      'team2.teamname as Team2Name',
      'tp1.home as Team1Home',
      'match.score as score'
    )
    .join('match', 'tp1.matchid', '=', 'match.matchid')
    .join('team as team1', 'team1.teamid', '=', 'tp1.teamid')
    .join('teamplayingmatch as tp2', function() {
      this.on('tp1.matchid', '=', 'tp2.matchid').andOn('tp1.teamid', '<>', 'tp2.teamid');
    })
    .join('team as team2', 'team2.teamid', '=', 'tp2.teamid')
    .where('tp1.teamid', teamID)
    .andWhere('match.seasonid', seasonid)
    .then(data => {
      // Process the data to assign the correct home and away teams
      const processedData = data.map(game => {
        const isTeam1Home = game.Team1Home;

        return {
          MatchID: game.MatchID,
          Date: game.Date,
          Time: game.Time, // Added time field in the processed data
          HomeTeamID: isTeam1Home ? game.Team1ID : game.Team2ID,
          HomeTeamName: isTeam1Home ? game.Team1Name : game.Team2Name,
          AwayTeamName: isTeam1Home ? game.Team2Name : game.Team1Name,
          score: game.score,
          a_id: isTeam1Home ? game.Team2ID : game.Team1ID,
          h_id: isTeam1Home ? game.Team1ID : game.Team2ID
        };
      });

      res.json(processedData);
    })
    .catch(err => console.error('Database query error:', err));
};






  const addClub = (req,res, postgres) =>{
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
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save to the database' });
    }
  }



  const getClubBySeason = (req, res, postgres) => {
    const { seasonid } = req.body;
  
    postgres
      .select('team.*')
      .from('team')
      .join('teamseason', 'team.teamid', 'teamseason.teamid')
      .where('teamseason.seasonid', seasonid)
      .then(data => res.json(data))
      .catch(err => {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Unable to fetch teams' });
      });
  };
  





  module.exports = {
    getClubsList,
    getClubBySeason,
    getClubGames,
    addClub
};

