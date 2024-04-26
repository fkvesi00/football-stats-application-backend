const jwt = require('jsonwebtoken')
require('dotenv').config()

const checkToken = (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1]

  // If the token is not in the header, check the cookies
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=')
      acc[key.trim()] = value.trim()
      return acc
    }, {})
    token = cookies.access_token
  }

  if (!token) {
    res.status(401).json({ message: 'Invalid or missing token' })
    return
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    res.status(401).json({ message: 'JWT secret not set' })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded.user

    // Set the token in the cookie for subsequent requests
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    })

    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = {
  checkToken,
}
