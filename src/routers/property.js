const express = require('express')
const { Stock } = require('../models/Stock')
const { Request } = require('../models/Request')
const { Property } = require('../models/Property')
const { authMiddleware } = require('../middleware/authMiddleware')
const { uploadMiddleware } = require('../middleware/uploadMiddleware')

const router = express.Router()

router.get('/properties/submit', authMiddleware, (req, res) => {

  if (req.user)
    res.render('submitProperty', { user: req.user, images: null })
  else
    res.redirect('/authentication/login')

})

router.post('/properties/submit', [authMiddleware, uploadMiddleware.any()], async (req, res) => {

  try {
    const propertyObject = {
      ...req.body,
      images: [],
      tokenId: 1,
      initialStock: {
        owner: req.user._id,
        value: req.body.fractions,
        type: 'unlisted'
      }
    }
    delete propertyObject.transactionId

    for (file of req.files) {

      if (file.mimetype === 'application/json')
        propertyObject.propertyInfo = process.env.DOMAIN + process.env.PROPERTIES_INFO_DIR.slice(7) + '/' + file.filename
      else
        propertyObject.images.push({ image: process.env.DOMAIN + process.env.PROFILES_PROPERTIES_DIR.slice(7) + '/' + file.filename })

    }

    const requestObject = {
      owner: req.user._id,
      type: 'submitProperty',
      transactionId: req.body.transactionId,
      address: req.user.address,
      createdOn: (new Date()).getTime(),
      property: propertyObject
    }

    const request = new Request(requestObject)

    await request.save()
    res.status(201).send()
  } catch (error) {
    res.status(400).send({
      error: error
    })
  }

})

router.get('/properties/:id', authMiddleware, async (req, res) => {

  if (req.user) {
    const propertyID = req.params.id

    try {
      const property = await Property.findOne({ _id: propertyID })

      if (!property)
        res.render('notFound404', { user: req.user })

      await property.populate({
        path: 'stocks',
        populate: {
          path: 'stock',
          model: 'Stock',
          populate: {
            path: 'owner',
            model: 'User'
          }
        }
      })

      res.render('property', {
        user: req.user,
        property: {
          ...property._doc,
          images: property.images.map((image) => image.image),
          unlistedStocks: property.stocks.filter((stock) => stock.stock.type === 'unlisted').map((stock) => {
            return {
              owner: stock.stock.owner._doc,
              stocksCount: stock.stock.value,
              stockID: stock.stock._id.toString()
            }
          }),
          listedStocks: property.stocks.filter((stock) => stock.stock.type === 'listed').map((stock) => {
            return {
              owner: stock.stock.owner._doc,
              stocksCount: stock.stock.value,
              stockId: stock.stock._id.toString()
            }
          })
        }
      })

    } catch (error) {

      if (error.message.includes('Cast to ObjectId failed'))
        res.render('notFound404', { user: req.user })

      res.status(500).send()
    }

  } else
    res.redirect('/authentication/login')

})

module.exports.propertyRouter = router