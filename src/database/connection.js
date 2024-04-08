require('dotenv').config()

const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false,
    },
  },
})

db.raw('select 1+1 as result')
  .then(() => {
    console.log('Database connection successful')
  })
  .catch((err) => {
    console.error('Error connecting to database:', err)
  })

module.exports = db
