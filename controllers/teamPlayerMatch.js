const getTeamMatchPlayer = (req,res, postgres) => {
    const {matchID} = req.body;

    postgres('teammatchplayer')
    .select('matchid', 'team.teamid', 'teamname', 'playername', 'player.playerid')
    .join('player', 'teammatchplayer.playerid', '=', 'player.playerid')
    .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
    .where('matchid', matchID)
    .then( data => res.json(data))
    .catch(err => console.log(err));
}

const addTeamMatchPlayer = async (req, res,postgres) => {
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
}}

module.exports = {
    getTeamMatchPlayer,
    addTeamMatchPlayer
}