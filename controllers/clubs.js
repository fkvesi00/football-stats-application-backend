const getClubsList = (req,res, postgres) => {
    //pronalazi sve klubove
    postgres.select('*').from('team').then(data => res.json(data))
    .catch(err => console.log(err));
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





  const getClubBySeason = (req,res, postgres) => {
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
}





  module.exports = {
    getClubsList,
    getClubBySeason,
    getClubGames
};

