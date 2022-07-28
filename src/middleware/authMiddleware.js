const { User } = require('../models/User')
const jwt = require('jsonwebtoken')

const authMiddleware = async (req, res, next) => {

  try {
    const token = req.cookies.accessToken
    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    const user = await User.findOne({ username: decoded.username, 'tokens.token': token })

    if (!user) {
      throw new Error('User not found .')
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {

    if (req.method === 'GET') {
      req.user = null
      next()
    }
    else
      res.status(401).send({
        error: error.message
      })

  }

}

module.exports.authMiddleware = authMiddleware