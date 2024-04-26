const userRepository = require('../repository/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const createUser = async (email, password, isAdmin = true) => {
  const found = await userRepository.findByEmail(email)

  if (found) {
    throw new Error('User already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await userRepository.createUser(email, hashedPassword, isAdmin)
  } catch (error) {
    throw new Error('Database error: ' + error.message)
  }
}

const loginUser = async (email, password, res) => {
  const user = await userRepository.findByEmail(email)

  if (!user) throw new Error('User does not exist')

  const passwordMatches = await bcrypt.compare(password, user.password)

  if (!passwordMatches) {
    throw new Error('Incorrect password')
  }

  const token = generateToken(user)

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  })

  return token
}

const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET
  const jwtExpiryTime = process.env.JWT_EXPIRY_TIME || '15m'

  if (!jwtSecret) {
    throw new Error('JWT secret not set')
  }

  try {
    return jwt.sign({ user }, jwtSecret, {
      expiresIn: jwtExpiryTime,
    })
  } catch (error) {
    throw new Error('Failed to generate JWT: ' + error.message)
  }
}

module.exports = {
  loginUser,
  createUser,
}
