const getPlayersList = (req,res,postgres) => {
    postgres
      .select('*')
      .from('player')
      .then((data) => res.json(data))
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: 'Error fetching players' });
      });
}

const getPlayersOfClub = (req,res,postgres) => {
    const {teamID} = req.body
  postgres('player')
  .select('*')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .where('playerteam.teamid', teamID)
  .then(data => res.json(data))
  .catch(err => console.log(err));
}

module.exports = {
    getPlayersList,
    getPlayersOfClub
}