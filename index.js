const express = require('express')
const app = express()

const port = 3000
const cors = require("cors")

app.use(express.static('public'));
app.use(express.urlencoded({extended:false}))
app.use(express.json())

const knex=require('knex');


const postgres=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'lozinka',
    database : 'UMA_Metkovic'
  }
});


app.use(cors())

//pronalazi sve klubove
app.get('/clubs', function (req, res) {
  postgres.select('*').from('team').then(data => res.json(data))
  .catch(err => console.log(err));
})

//pronalazi sve igrace
app.get('/players', (req,res) => {
  postgres.select('*').from('player').then(data => res.json(data))
  .catch(err => console.log(err));
})

//pronadi sve klubove u sezoni
app.post('/teamBySeason', (req,res) =>{
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
})

//trazi sve igrace, koji su nastupili za neki klub(nebitno sezona)
app.get('/playerTeam', (req,res) => {
  postgres('player')
  .select('player.playername', 'team.teamname')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .join('team', 'team.teamid', '=', 'playerteam.teamid')
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi igrace po klubu(nije ukljucena sezona)
app.post('/players', (req,res)=>{
  const {teamID} = req.body
  postgres('player')
  .select('*')
  .join('playerteam', 'player.playerid', '=', 'playerteam.playerid')
  .where('playerteam.teamid', teamID)
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi sve utakmice pojedinog kluba
app.post('/clubGames', (req,res) => {
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
})

//trazi sve utakmice lige u toj sezoni(treba ubacit i natjecanje, uzimamo u obzir i odigrane i utakmice koje se trebaju odigrati)
app.post('/matchesBySeason', (req,res) => {
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
})

//pronalazi sve igrace koji su nastupili u pojedinoj utakmici                                            (nismo dodali sezonu a mozda i ne moramo vidi cemo)
app.post('/teamMatchPlayer', (req, res) => {
  const {matchID} = req.body;
  postgres('teammatchplayer')
  .select('matchid', 'team.teamid', 'teamname', 'playername', 'player.playerid')
  .join('player', 'teammatchplayer.playerid', '=', 'player.playerid')
  .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
  .where('matchid', matchID)
  .then( data => res.json(data))
  .catch(err => console.log(err));
})

//koji igrac je zabio gol na utakmici
app.post('/scorers', (req, res) => {
  const {matchID} = req.body;
  postgres('goal').select('*').where('matchid', matchID)
  .then(data => res.json(data))
  .catch(err => console.log(err));
})

//trazi match po mathID
app.post('/specificMatch', (req, res) => {
  const {matchID} = req.body;
  postgres('teamplayingmatch')
      .select('match.matchid', 'team.teamid', 'teamname', 'logo', 'date', 'time', 'score', 'home')
      .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
      .join('match', 'match.matchid', '=', 'teamplayingmatch.matchid')
      .where('match.matchid', matchID)
      .then(data => res.json(data))
      .catch(err => console.log(err))
})
  
//trazi govole koji su pali na pojedinoj utakmici
app.post('/matchGoals' , (req,res) => {
  const {matchID} = req.body
  postgres.select('*')
  .from('goal')
  .where('matchid', '=', matchID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//nastupi igraca u svim sezonama 
app.post('/playerStats', (req,res) => {
  const {playerID} = req.body
  postgres.select('seasonname', 'teamname')
  .count('playername as app')
  .select('team.teamid', 'season.seasonid')
  .from('player')
  .join('teammatchplayer', 'player.playerid', '=', 'teammatchplayer.playerid')
  .join('team', 'team.teamid', '=', 'teammatchplayer.teamid')
  .join('match', 'match.matchid', '=', 'teammatchplayer.matchid')
  .join('season', 'match.seasonid', '=', 'season.seasonid')
  .where('player.playerid', playerID)
  .groupBy('seasonname', 'teamname', 'team.teamid', 'season.seasonid')
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//trazi pojedinog igraca
app.post('/player', (req,res) => {
  const {playerID} = req.body
  postgres.select('*')
  .from('player')
  .where('playerid', playerID)
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

//trazi sve golove igraca u svim sezonma za pojednie timove
app.post('/playerGoals', (req,res) => {
  const {playerID} = req.body
  postgres
  .select('goal.playerid', 'goal.teamid', 'match.seasonid')
  .count('goal.goalid as goals')
  .from('goal')
  .join('match', 'goal.matchid', 'match.matchid')
  .where('goal.playerid', playerID)
  .groupBy('goal.teamid', 'match.seasonid', 'goal.playerid')
  .then(data => res.json(data))
  .catch(err => console.log(err))
})

app.listen(port, ()=>{
  console.log(`Sluša na ${port}`);
}) 

/* 
app.post('/raspored', (req,res) => {
  const {id} = req.body;
  const kopijaRasporeda = JSON.parse(JSON.stringify(raspored));
  //funkcija koja pronalazi imena timova po id-u
  const rasporedSaImenima = (rez) => rez.map(raspored2 =>{
    for(let i=0;i<=clubs.length;i++){
      if(raspored2.home_team_ID === clubs[i].team_id){
          raspored2.home_team_ID = clubs[i].team_name
          break;
        }
      }  
    for(let j=0;j<=clubs.length;j++){
      if(raspored2.away_team_ID === clubs[j].team_id){
        raspored2.away_team_ID = clubs[j].team_name
        break;
      }
    }
    return raspored2;
  })
  if(!id){
    const rez = rasporedSaImenima(kopijaRasporeda)
    res.json(rez)

  }else{
    //ako je id true, to znaci, pronadi samo utakmice tog tima, sto sljdeca funkcija radi
    const rasporediTima = kopijaRasporeda.filter(raspored => {
     return (raspored.home_team_ID  === id)  || (raspored.away_team_ID === id)
    })
     
    const rez2 = rasporedSaImenima(rasporediTima)
    res.json(rez2)
  }
  
})

app.get('/utakmice', (req,res) =>{
  const kopijaUtakmica = JSON.parse(JSON.stringify(utakmice));
  const rasporedSaImenima = (rez) => rez.map(raspored2 =>{
    for(let i=0;i<=clubs.length;i++){
      if(raspored2.HomeTeamID === clubs[i].team_id){
          raspored2.HomeTeamID = clubs[i].team_name
          break;
        }
      }  
    for(let j=0;j<=clubs.length;j++){
      if(raspored2.AwayTeamID === clubs[j].team_id){
        raspored2.AwayTeamID = clubs[j].team_name
        break;
      }
    }
    return raspored2;
  })

  const rez = rasporedSaImenima(kopijaUtakmica);
  

  res.json(rez);
})

app.post('/utakmice',(req,res) =>{
  const {id} = req.body;
  const kopijaUtakmica = JSON.parse(JSON.stringify(utakmice));
  const rasporedSaImenima = (rez) => rez.map(raspored2 =>{
    for(let i=0;i<=clubs.length;i++){
      if(raspored2.HomeTeamID === clubs[i].team_id){
          raspored2.HomeTeamID = clubs[i].team_name
          break;
        }
      }  
    for(let j=0;j<=clubs.length;j++){
      if(raspored2.AwayTeamID === clubs[j].team_id){
        raspored2.AwayTeamID = clubs[j].team_name
        break;
      }
    }
    return raspored2;
  })
  
  
  const utakmicaTima = kopijaUtakmica.filter(utakmica =>{
    return (utakmica.HomeTeamID === id) || (utakmica.AwayTeamID === id)
  })

  const rez = rasporedSaImenima(utakmicaTima);
  

  res.json(rez);
})

app.get('/tablica', (req,res) =>{
  const kopijaTablice = JSON.parse(JSON.stringify(tablica));
  const rasporedSaImenima = (rez) => rez.map(raspored2 =>{
    for(let i=0;i<=clubs.length;i++){
      if(raspored2.TeamID === clubs[i].team_id){
          raspored2.teamName = clubs[i].team_name
          break;
        }
      }
      return raspored2;  
    })
    const rez = rasporedSaImenima(kopijaTablice);

  res.json(rez)
})
*/
