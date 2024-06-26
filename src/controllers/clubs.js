const db = require('../database/connection')

const getClubsList = async (req, res) => {
  try {
    // Pronalazi sve klubove
    const data = await db.select('*').from('team')

    // Update the logo property for each object
    const newData = data.map((obj) => {
      return {
        ...obj,
        logo: '/images/klada.jpg', // Adjust the path as needed
      }
    })

    res.json(newData)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

const getClubGames = (req, res) => {
  const { teamID } = req.body

  db('teamplayingmatch')
    .select(
      'match.matchid',
      'team.teamname',
      'match.score',
      'teamplayingmatch.home',
      'match.date',
      'match.time',
      'team.teamid',
    )
    .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
    .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
    .whereIn('match.matchid', function () {
      this.select('matchid').from('teamplayingmatch').where('teamid', teamID)
    })
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

const addClub = (req, res) => {
  const { clubID, teamName } = req.body

  console.log(typeof clubID, typeof teamName)
  // Check if the parameters are of the proper type
  if (typeof clubID !== 'number' || typeof teamName !== 'string') {
    return res.status(400).json({ error: 'Invalid data types' })
  }

  // Create a new club record in the database
  try {
    const tableName = 'team'
    const teamData = {
      teamid: clubID, // Replace with your teamID
      teamname: teamName, // Replace with your teamname
    }

    db(tableName)
      .insert(teamData)
      .then(() => console.log('Data inserted successfully'))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save to the database' })
  }
}

const getClubBySeason = (req, res) => {
  const { seasonID } = req.body

  db.distinct('team.teamname', 'team.teamid')
    .from('team')
    .join('teamplayingmatch', 'team.teamid', 'teamplayingmatch.teamid')
    .whereIn(
      'matchid',
      db('match').select('matchid').where('seasonid', seasonID),
    )
    .then((data) => res.json(data))
    .catch((err) => console.log(err))
}

module.exports = {
  getClubsList,
  getClubBySeason,
  getClubGames,
  addClub,
}
