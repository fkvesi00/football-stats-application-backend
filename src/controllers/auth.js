const authService = require('../services/auth')
const db = require('../database/connection')

const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const token = await authService.loginUser(email, password, res)
    res.status(200).json({ token })
  } catch (error) {
    res.status(401).json({ error: error.message || 'Failed to log in' })
  }
}

const createUser = async (req, res) => {
  const { email, password } = req.body
  try {
    await authService.createUser(email, password)
    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error creating user' })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await db('users').select('*')
    res.status(200).json({ users })
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  login,
  getUsers,
  createUser,
}
