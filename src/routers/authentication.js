const express = require('express')
const { User } = require('../models/User')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/authentication/register', authMiddleware, async (req, res) => {

  if (!req.user)
    res.render('register', { user: null })
  else
    res.redirect('/users/profile')

})

router.post('/authentication/register', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    res.status(201).send()
  } catch (error) {
    res.status(400).send({
      error: error.message
    })
  }

})

router.get('/authentication/login', authMiddleware, (req, res) => {

  if (!req.user)
    res.render('login', { user: null })
  else
    res.redirect('/users/profile')

})

router.post('/authentication/login', async (req, res) => {

  const username = req.body.username
  const password = req.body.password

  try {
    const user = await User.findByCredentials(username, password)
    const token = await user.generateAuthToken()
    res.cookie('accessToken', token).send({ token })
  } catch (error) {
    res.status(400).send({
      error: error.message
    })
  }

})

router.post('/authentication/logout', authMiddleware, async (req, res) => {

  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
    await req.user.save()
    res.clearCookie('accessToken').send()
  } catch (error) {
    res.status(500).send()
  }

})

module.exports.authenticationRouter = router