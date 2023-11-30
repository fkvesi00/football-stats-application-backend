
const getMatchesBySeason = (req,res,postgres) => {
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
}

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

module.exports = {
    getMatchesBySeason,
    findMatchById
}