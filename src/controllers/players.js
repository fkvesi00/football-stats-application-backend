const db = require('../database/connection')

const getPlayersList = (req, res) => {
  db.select('*')
    .from('player')
    .then((data) => res.json(data))
    .catch((err) => {
      console.log(err)
      res.status(500).json({ error: 'Error fetching players' })
    })
}

const getPlayersOfClub = (req, res) => {
  const { teamID } = req.body
  db('player')
    .select('*')
    .join(
      'playerteamseason',
      'player.playerid',
      '=',
      'playerteamseason.playerid',
    )
    .where('playerteamseason.teamid', teamID)
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const getPlayerAppAllSeasons = (req, res) => {
  const { playerID } = req.body

  db.select('seasonname', 'teamname')
    .count('playername as app')
    .select('team.teamid', 'season.seasonid')
    .from('player')
    .join('teammatchplayer', 'player.playerid', '=', 'teammatchplayer.playerid')
    .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
    .join('match', 'match.matchid', '=', 'teammatchplayer.matchid')
    .join('season', 'match.seasonid', '=', 'season.seasonid')
    .where('player.playerid', playerID)
    .groupBy('seasonname', 'teamname', 'team.teamid', 'season.seasonid')
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const getPlayer = (req, res) => {
  const { playerID } = req.body

  db.select('*')
    .from('player')
    .where('playerid', playerID)
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const addPlayer = (req, res) => {
  const { playerID, playerName, playerBirth, playerNationality } = req.body

  console.log(
    typeof playerID,
    typeof playerName,
    typeof playerBirth,
    typeof playerNationality,
  )
  // Check if the parameters are of the proper type
  if (
    typeof playerID !== 'number' ||
    typeof playerName !== 'string' ||
    typeof playerBirth !== 'string' ||
    typeof playerNationality !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid data types' })
  }

  // Create a new club record in the database
  try {
    const tableName = 'player'
    const teamData = {
      playerid: playerID,
      playername: playerName,
      playerbirth: playerBirth,
      playernationality: playerNationality,
    }

    db(tableName)
      .insert(teamData)
      .then(() => console.log('Data inserted successfully'))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save to the database' })
  }
}

const addPlayerToClub = async (req, res) => {
  const { playerid, teamid, seasonid } = req.body

  try {
    await db.transaction(async (trx) => {
      await trx.insert({ playerid, teamid, seasonid }).into('playerteamseason')

      // Additional transactions or operations can be added here if needed
    })

    console.log(
      'Transaction complete. Data inserted successfully. Player is added to club',
    )
  } catch (err) {
    console.error('Error inserting data:', err)
    // If an error occurs, the transaction will automatically be rolled back
  }
}

module.exports = {
  getPlayersList,
  getPlayersOfClub,
  getPlayerAppAllSeasons,
  getPlayer,
  addPlayer,
  addPlayerToClub,
}
