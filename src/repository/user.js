const db = require('../database/connection')

const findByEmail = async (email) => {
  const user = await db('users').where('email', email).first()

  return user
}

const createUser = async (email, password, admin) => {
  try {
    await db('users').insert({ email, password, admin })
  } catch (error) {
    throw new Error('Database insert failed: ' + error.message)
  }
}

module.exports = {
  findByEmail,
  createUser,
}
