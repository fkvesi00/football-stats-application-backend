// this is just a temporary solution for storing the pga and scorers routes
const db = require('../database/connection')



// geetting list of apperances and goals fur jeden club
const getPga = (req, res) => {
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
}

const getScorers = (req, res) => {
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
}

module.exports = {
    getPga,
    getScorers
}