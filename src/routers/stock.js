const express = require('express')
const { Stock } = require('../models/Stock')
const { authMiddleware } = require('../middleware/authMiddleware')
const { User } = require('../models/User')
const { Request } = require('../models/Request')

const router = express.Router()

router.post('/stocks/list', authMiddleware, async (req, res) => {

  const stockID = req.body.stockID
  const fractionsCountToList = Number(req.body.fractionsCountToList)

  try {

    const stock = await Stock.findOne({ _id: stockID })
    await stock.populate({ path: 'property', model: 'Property' })

    const requestObject = {
      owner: req.user._id,
      type: 'listFractions',
      transactionId: req.body.transactionId,
      createdOn: (new Date()).getTime(),
      address: req.user.address,
      property: {
        name: stock.property.name,
        price: stock.property.price,
        fractions: stock.property.fractions
      },
      listFractions: {
        stockId: stock._id,
        value: fractionsCountToList
      }
    }

    const request = new Request(requestObject)
    await request.save()
    res.status(201).send()

  } catch (error) {
    res.status(400).send({
      error: error.message
    })
  }

})

router.delete('/stocks/list', authMiddleware, async (req, res) => {

  const stockID = req.body.stockID

  try {

    const stock = await Stock.findOne({ _id: stockID })
    await stock.populate({ path: 'property', model: 'Property' })

    const requestObject = {
      owner: req.user._id,
      type: 'unlistFractions',
      transactionId: req.body.transactionId,
      createdOn: (new Date()).getTime(),
      address: req.user.address,
      property: {
        name: stock.property.name,
        price: stock.property.price,
        fractions: stock.property.fractions
      },
      unlistFractions: {
        stockId: stock._id,
        value: stock.value
      }
    }

    const request = new Request(requestObject)
    await request.save()
    res.status(201).send()

  } catch (error) {
    res.status(400).send({
      error: error.message
    })
  }

})

router.post('/stocks/purchase', authMiddleware, async (req, res) => {

  const stockID = req.body.stockID

  try {

    const stock = await Stock.findOne({ _id: stockID })
    await stock.populate({ path: 'property', model: 'Property' })

    const requestObject = {
      owner: req.user._id,
      type: 'purchaseFractions',
      transactionId: req.body.transactionId,
      createdOn: (new Date()).getTime(),
      address: req.user.address,
      property: {
        name: stock.property.name,
        pricate: stock.property.price,
        fractions: stock.property.fractions
      },
      purchaseFractions: {
        value: req.body.fractionsCountToPurchase,
        propertyId: stock.property._id,
        stockToBuyFrom: stock._id
      }
    }

    const request = new Request(requestObject)
    await request.save()
    res.status(201).send()

  } catch (error) {
    res.status(400).send({
      error: error.message
    })
  }

})

router.get('/stocks/:stockid', authMiddleware, async (req, res) => {

  if (req.user) {
    const stockid = req.params.stockid
    try {
      const stock = await Stock.findOne({ _id: stockid })
      if (stock) {
        await stock.populate({
          path: 'property',
          model: 'Property'
        })

        res.send({ tokenid: stock.property.tokenId, buyer: req.user.address, seller: stock.address, fractionPrice: stock.property.price / stock.property.fractions, propertyId: stock.property._id, fractions: stock.value })
      } else {
        res.status(400).send({
          error: error.message
        })
      }

    } catch (error) {
      res.status(500).send()
    }

  } else
    res.status(401).send({ error: 'not authorized .' })

})

module.exports.stockRouter = router