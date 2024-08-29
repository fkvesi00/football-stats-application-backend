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

  const getClubGames = (req,res, postgres) => {
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
  }

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

