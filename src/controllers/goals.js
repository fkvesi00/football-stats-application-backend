const db = require('../database/connection')

const scorersOfMatch = (req, res) => {
  const { matchID } = req.body

  db('goal')
    .select('*')
    .where('matchid', matchID)
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const goalsOfMatch = (req, res) => {
  const { matchID } = req.body

  db.select('*')
    .from('goal')
    .where('matchid', '=', matchID)
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const allPlayerGoals = (req, res) => {
  const { playerID } = req.body

  db.select('goal.playerid', 'goal.teamid', 'match.seasonid')
    .count('goal.goalid as goals')
    .from('goal')
    .join('match', 'goal.matchid', 'match.matchid')
    .where('goal.playerid', playerID)
    .groupBy('goal.teamid', 'match.seasonid', 'goal.playerid')
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

module.exports = {
  scorersOfMatch,
  goalsOfMatch,
  allPlayerGoals,
}
