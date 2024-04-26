const express = require('express')
const cors = require('cors')
const routeManager = require('./src/routes/routes')
const db = require('./src/database/connection.js')
const corsConfig = require('./src/config/cors.js')
require('dotenv').config()

const port = process.env.PORT || 5001
const app = express()

// Use cors middleware with your custom options
app.use(cors(corsConfig))

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//routes
app.get('/', (req, res) => res.json('My api is running'))

app.use('/clubs', routeManager.clubRoute)
app.use('/players', routeManager.playerRoute)
app.use('/matches', routeManager.matchesRoute)
app.use('/calculations', routeManager.calculationRoute)
app.use('/teamPlayerMatch', routeManager.teamPlayerMatchRoute)
app.use('/goals', routeManager.goalRoute)
app.use('/pga', routeManager.pgaRoute)
app.use('/scorers', routeManager.scorerRoute)
app.use('/auth', routeManager.authRoute)


app.listen(port, () => {
  console.log(`Sluša na ${port}`)
})
