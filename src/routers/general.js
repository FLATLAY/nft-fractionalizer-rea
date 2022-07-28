const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {

  if (!req.user)
    res.render('getStarted', { user: null })
  else
    res.redirect('/marketplace')

})

router.get('*', authMiddleware, (req, res) => {

  res.render('notFound404', { user: req.user })

})

module.exports.generalRouter = router