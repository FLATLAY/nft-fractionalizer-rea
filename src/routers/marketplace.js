const express = require('express')
const { Property } = require('../models/Property')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/marketplace', authMiddleware, async (req, res) => {

  if (req.user) {

    try {
      const properties = await Property.find({})
      res.render('marketplace', {
        user: req.user,
        properties
      })
    } catch (error) {
      res.status(500).send()
    }

  } else {
    res.redirect('/authentication/login')
  }

})

module.exports.marketplaceRouter = router