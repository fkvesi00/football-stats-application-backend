const seasonID = 1;
const stats = []
const matchFormat = utakmica => {
    const matches1 = [];
  
    utakmica.forEach((utakmica2, j) => {
      for (let i = j + 1; i < utakmica.length; i++) {
        if (utakmica2.matchid === utakmica[i].matchid) {
          const homeTeam = utakmica2.home ? utakmica2 : utakmica[i];
          const awayTeam = utakmica2.home ? utakmica[i] : utakmica2;
  
          const match = {
            match_id: utakmica2.matchid,
            date: utakmica2.date,
            time: utakmica2.time,
            h_team: homeTeam.teamname,
            h_id: homeTeam.teamid,
            score: utakmica2.score,
            a_team: awayTeam.teamname,
            a_id: awayTeam.teamid
          };
          
          matches1.push(match);
        }
      }
    });
  
    return matches1;
  }; 

  const teamMatches = (teams, allMatches) => {
    const arrayOfArrays = []
    teams.map(team =>{
      const matchesOfTeam = allMatches.map(match => {
        if((team.teamid === match.a_id) ||  (team.teamid === match.h_id))
          return match;
      })
      const filteredArray = matchesOfTeam.filter(obj => obj !== undefined);
      const object = {
        id:team.teamid,
        name:team.teamname,
        matches:filteredArray
      }
      
      arrayOfArrays.push(object)
    })
    return arrayOfArrays
  }


  const formatMatches = async (req, res, postgres) => {
    try {
      // Call the getClubsList function
      const klubovi = await postgres.select('*').from('team').catch(err => console.log(err));
     
      // Query for matches where score is null
      const queryMatchesWithNullScore = postgres('teamplayingmatch')
        .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid')
        .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
        .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
        .where('match.seasonid', seasonID)
        .whereNull('match.score');
  
      // Query for matches where score is not null
      const queryMatchesWithNonNullScore = postgres('teamplayingmatch')
        .select('match.matchid', 'team.teamname', 'match.score', 'teamplayingmatch.home', 'match.date', 'match.time', 'team.teamid')
        .join('match', 'teamplayingmatch.matchid', '=', 'match.matchid')
        .join('team', 'team.teamid', '=', 'teamplayingmatch.teamid')
        .where('match.seasonid', seasonID)
        .whereNotNull('match.score');
  
      // Execute both queries asynchronously
      Promise.all([queryMatchesWithNullScore, queryMatchesWithNonNullScore])
        .then(([matchesWithNullScore, matchesWithNonNullScore]) => {
          // Format the data if needed
          const formattedMatchesWithNullScore = matchFormat(matchesWithNullScore);
          const formattedMatchesWithNonNullScore = matchFormat(matchesWithNonNullScore);
  
          // You can now use or process both sets of formatted data
          ;
          const allGamesByClub = teamMatches(klubovi,formattedMatchesWithNonNullScore)
          allGamesByClub.forEach(club =>{
            const clubStats = {
              id:0,
              name:'',
              won: 0,
              draw: 0,
              lost: 0,
              points: 0,
              gf: 0,
              ga: 0,
              pm: 0,
              name: '',
              rank:''
            }
            
          clubStats.id = club.id
          clubStats.name = club.name
            for (const utakmica of club.matches){
             
            if(utakmica.h_id == club.id){
              clubStats.gf+=parseInt(utakmica.score[0])
              clubStats.ga+=parseInt(utakmica.score[2])
              clubStats.pm=clubStats.gf-clubStats.ga
              if(utakmica.score[0] > utakmica.score[2]){
                clubStats.points+=3
                clubStats.won++;
              }
              else if(utakmica.score[0] < utakmica.score[2]){
                clubStats.lost++
              }
              else {
                clubStats.draw++;
                clubStats.points++;
              }
            }else{
              clubStats.gf+=parseInt(utakmica.score[2])
              clubStats.ga+=parseInt(utakmica.score[0])
              clubStats.pm= clubStats.gf - clubStats.ga
              if(utakmica.score[2] > utakmica.score[0]){
                clubStats.won++;
                clubStats.points+=3;
              }else if(utakmica.score[2] < utakmica.score[0]){
                clubStats.lost++
              }else{
                clubStats.draw++;
                clubStats.points++;
              }
            }
          }
            stats.push(clubStats)
          })
          const sortedStats = stats.sort((a, b) => b.points - a.points)
          
          sortedStats.map((club,i) => club.rank=i)
            
          // Send the response or perform other actions as needed
          res.json({
            table:sortedStats,
            matchesWithNullScore: formattedMatchesWithNullScore,
            matchesWithNonNullScore: formattedMatchesWithNonNullScore,
          });
        })
        .catch((err) => {
          console.log(err);
          // Handle errors as needed
          res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (err) {
      console.log(err);
      // Handle errors as needed
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
 


module.exports = {
  formatMatches,
};