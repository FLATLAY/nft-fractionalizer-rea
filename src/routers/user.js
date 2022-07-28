const express = require('express')
const bcrypt = require('bcrypt')
const moment = require('moment')
const { User } = require('../models/User')
const { Request } = require('../models/Request')
const { authMiddleware } = require('../middleware/authMiddleware')
const { uploadMiddleware } = require('../middleware/uploadMiddleware')

const router = express.Router()

router.get('/users/profile', authMiddleware, async (req, res) => {

  if (req.user) {
    await req.user.populate({
      path: 'stocks',
      populate: {
        path: 'property',
        model: 'Property'
      }
    })

    await req.user.populate({ path: 'requests' })

    const pending = req.user.requests.filter((request) => request.status === 'pending')

    let stocksBought = 0, stocksBoughtValue = 0, ownedProperties = 0
    req.user.stocks.forEach((stock) => {
      stocksBought += stock.value
      stocksBoughtValue += stock.value * (stock.property.price / stock.property.fractions)
      if (stock.value === stock.property.fractions)
        ownedProperties += 1
    })

    let userBalance = 0
    try {
      const response = await fetch(process.env.TESTNET + `address/${req.user.address}/balances`)
      if (response.status === 200) {
        const result = await response.json()
        userBalance = result.stx.balance
      }
    } catch (error) {
      console.log(error)
    }

    res.render('profile', {
      user: {
        ...req.user._doc,
        stocksBought,
        stocksBoughtValue,
        ownedProperties,
        balance: userBalance,
        pendingRequests: pending.length
      },
      unlistedStocks: req.user.stocks.filter((stock) => stock.type === 'unlisted').map((stock) => {
        return {
          ...stock._doc,
          id: stock._doc._id.toString(),
          stocksCount: stock._doc.value,
          property: stock.property,
          address: stock.address
        }
      }),
      listedStocks: req.user.stocks.filter((stock) => stock.type === 'listed').map((stock) => {
        return {
          ...stock._doc,
          id: stock._doc._id.toString(),
          stocksCount: stock._doc.value,
          property: stock.property,
          address: stock.address
        }
      })
    })
  }
  else
    res.redirect('/authentication/login')

})

router.get('/users/profile/edit', authMiddleware, async (req, res) => {

  if (req.user)
    res.render('editUser', { user: req.user })
  else
    res.redirect('/authentication/login')

})

router.patch('/users/profile/edit', [authMiddleware, uploadMiddleware.single('image')], async (req, res) => {

  if (req.user) {

    try {

      if (req.body.fullname) {
        req.user.fullname = req.body.fullname
      }

      if (req.file) {
        req.user.image = process.env.DOMAIN + process.env.PROFILES_PROPERTIES_DIR.slice(7) + '/' + req.file.filename
      }

      const isMatch = await bcrypt.compare(req.body.currentPassword, req.user.password)
      if (isMatch) {
        req.user.password = req.body.newPassword
      }

      if (req.body.address) {
        req.user.address = req.body.address
      }

      await req.user.save()
      res.send()
    } catch (error) {
      res.status(400).send({
        error: error.message
      })
    }
  } else
    res.redirect('/authentication/login')

})

router.get('/users/profile/requests', authMiddleware, async (req, res) => {

  if (req.user) {

    try {

      await req.user.populate({ path: 'requests' })

      req.user.requests.sort((a, b) => {
        if (a.createdOn > b.createdOn) return -1
        else if (a.createdOn < b.createdOn) return 1
        else return 0
      })

      const pending = req.user.requests.filter((request) => {
        return request.status === 'pending'
      })

      pending.forEach(async (request) => {
        await request.refreshStatus()
      })

      res.render('requests', {
        user: {
          fullname: req.user.fullname,
          image: req.user.image
        },
        allRequests: req.user.requests.map((request) => {
          return {
            createdOn: moment(request.createdOn).fromNow(),
            status: request.status,
            type: request.type,
            address: request.address,
            description: Request.getDescription(request)
          }
        }),
        pendingRequests: pending.filter((request) => request.status === 'pending').map((request) => {
          return {
            createdOn: moment(request.createdOn).fromNow(),
            status: request.status,
            type: request.type,
            address: request.address,
            description: Request.getDescription(request)
          }
        })
      })

    } catch (error) {
      res.status(400).send({
        error: error.message
      })
    }

  }
  else
    res.redirect('/authentication/login')

})

/** public profile of users */
router.get('/users/:username', authMiddleware, async (req, res) => {

  const username = req.params.username

  if (req.user && req.user.username === username) {
    res.redirect('/users/profile')
  }

  try {
    const user = await User.findOne({ username })

    if (req.user) {

      if (!user) {
        res.render('notFound404', { user: req.user })
      } else {
        await user.populate({
          path: 'stocks',
          populate: {
            path: 'property',
            model: 'Property'
          }
        })

        res.render('publicProfile', {
          user: req.user,
          publicUser: user,
          unlistedStocks: user.stocks.filter((stock) => stock.type === 'unlisted').map((stock) => {
            return {
              ...stock._doc,
              id: stock._id.toString(),
              stocksCount: stock.value,
              property: stock.property
            }
          }),
          listedStocks: user.stocks.filter((stock) => stock.type === 'listed').map((stock) => {
            return {
              ...stock._doc,
              id: stock._id.toString(),
              stocksCount: stock.value,
              property: stock.property
            }
          })
        })
      }

    } else {

      if (!user)
        res.render('notFound404', { user: null })
      else
        res.render('publicProfile', { publicUser: user })

    }

  } catch (error) {
    res.status(500).send()
  }

})

router.get('/users/profile/get-principal', authMiddleware, (req, res) => {

  if (req.user)
    res.send({ principal: req.user.address })
  else
    res.status(401).send({ error: 'not authorized .' })

})

module.exports.userRouter = router