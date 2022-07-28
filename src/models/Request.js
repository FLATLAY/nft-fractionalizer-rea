const mongoose = require('mongoose')
const { Property } = require('./Property')
const { Stock } = require('./Stock')

const requestPropertySchema = {
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: 1
  },
  fractions: {
    type: Number,
    min: 1
  },
  propertyInfo: {
    type: String,
  },
  createdOn: {
    type: Number,
    default: (new Date()).getTime()
  },
  tokenId: {
    type: String,
  },
  images: [{
    image: {
      type: String,
    }
  }],
  initialStock: {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    value: {
      type: Number,
      min: 1
    },
    type: {
      type: String,
      default: 'unlisted'
    }
  }
}

const requestPurchaseFractionsSchema = {
  value: {
    type: Number,
    min: 1
  },
  type: {
    type: String,
    default: 'unlisted'
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  stockToBuyFrom: { // stock to buy fractions from
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }
}

const requestListFractionsSchema = {
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  value: {
    type: Number,
    min: 1
  }
}

const requestUnlistFractionsSchema = {
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  value: {
    type: Number,
    min: 1
  }
}

const requestSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: { // listFractions, unlistFractions, purchaseFractions, submitProperty 
    type: String,
    required: true
  },
  createdOn: {
    type: Number,
    required: true,
    default: (new Date()).getTime()
  },
  status: {
    type: String,
    required: true,
    default: 'pending'
  },
  address: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true
  },
  property: requestPropertySchema,
  purchaseFractions: requestPurchaseFractionsSchema,
  listFractions: requestListFractionsSchema,
  unlistFractions: requestUnlistFractionsSchema

}, { toObject: { virtuals: true } })

const submitProperty = async (request, result) => {

  const stock = new Stock({ owner: request.owner, value: request.property.initialStock.value, type: request.property.initialStock.type, address: request.address })
  const propertyObject = { ...request.property, stocks: [{ stock }] }; delete propertyObject.initialStock

  if (result.tx_result.repr.includes('ok'))
    propertyObject.tokenId = result.tx_result.repr.slice(5, result.tx_result.repr.length - 1)

  const property = new Property(propertyObject)
  try {
    await property.save()
    await stock.save()
  } catch (error) {
    console.log(error)
  }

}

const purchaseFractions = async (request) => {

  const newStock = new Stock({ owner: request.owner, value: request.purchaseFractions.value, type: 'unlisted', address: request.address })

  try {

    const prevStock = await Stock.findOne({ _id: request.purchaseFractions.stockToBuyFrom })

    if (prevStock) {

      const property = await Property.findOne({ _id: request.purchaseFractions.propertyId })
      if (property) {
        prevStock.value -= request.purchaseFractions.value

        if (prevStock.value > 0) {
          await prevStock.save()
        } else {
          await property.removeStock(prevStock._id)
          await Stock.deleteOne({ _id: prevStock._id, type: 'listed' })
        }

        const unlistedStock = await property.stockExists(request.owner, 'unlisted', request.address)

        if (unlistedStock) {
          unlistedStock.stock.value += request.purchaseFractions.value
          await unlistedStock.stock.save()
        } else {
          await newStock.save()
          await property.addStock(newStock)
        }
      }
    }

  } catch (error) {
    console.log(error)
  }

}

const listFractions = async (request) => {

  try {

    const stock = await Stock.findOne({ _id: request.listFractions.stockId, owner: request.owner, type: 'unlisted', address: request.address })

    if (stock) {

      await stock.populate({
        path: 'property',
        model: 'Property'
      })

      const property = stock.property

      const result = await property.stockExists(request.owner, 'listed', request.address)
      if (!result) {
        stock.value -= request.listFractions.value

        if (stock.value > 0) {
          await stock.save()
        } else {
          await property.removeStock(stock._id)
          await Stock.deleteOne({ _id: stock._id, type: 'unlisted' })
        }

        const newStock = new Stock({ owner: request.owner, value: request.listFractions.value, type: 'listed', address: request.address })
        await newStock.save()
        await property.addStock(newStock)
      }
    }

  } catch (error) {
    console.log(error)
  }

}

const unlistFractions = async (request) => {

  try {

    const stock = await Stock.findOne({ _id: request.unlistFractions.stockId, owner: request.owner, type: 'listed', address: request.address })

    if (stock) {

      await stock.populate({
        path: 'property',
        model: 'Property'
      })

      const property = stock.property

      const result = await property.stockExists(request.owner, 'listed', request.address)

      if (result) {
        const unlistedStock = await property.stockExists(request.owner, 'unlisted', request.address)

        if (unlistedStock) {
          unlistedStock.stock.value += result.stock.value
          await unlistedStock.stock.save()
        } else {
          const newStock = new Stock({ owner: request.owner, value: result.stock.value, address: request.address })
          await newStock.save()
          await property.addStock(newStock)
        }

        await property.removeStock(stock._id)
        await Stock.deleteOne({ _id: result.stock._id, type: 'listed' })
      }
    }

  } catch (error) {
    console.log(error)
  }

}

requestSchema.methods.refreshStatus = async function () {
  const request = this

  if (request.status === 'pending') {
    try {
      const response = await fetch(process.env.TESTNET + 'tx/' + request.transactionId)

      if (response.status === 200) {
        const result = await response.json()

          if (result.tx_status === 'success') {

            if (request.type === 'submitProperty')
              submitProperty(request, result)
            else if (request.type === 'purchaseFractions')
              purchaseFractions(request)
            else if (request.type === 'listFractions')
              listFractions(request)
            else // unlistFractions
              unlistFractions(request)
          }

          request.status = result.tx_status
          await request.save()
      }

    } catch (error) {
      console.log(error)
    }
  }

  return request.status
}

requestSchema.statics.getDescription = (request) => {
  if (request.type === 'listFractions') {
    return `Listing ${request.listFractions.value} fractions from ${request.property.name} .`
  } else if (request.type === 'unlistFractions') {
    return `Unlisting ${request.unlistFractions.value} fractions from ${request.property.name} .`
  } else if (request.type === 'purchaseFractions') {
    return `Purchasing ${request.purchaseFractions.value} fractions from ${request.property.name} .`
  } else { // submitProperty
    return `Submitting ${request.property.name} for ${request.property.price} ( STX ) with ${request.property.fractions} fractions .`
  }
}

const requestModel = mongoose.model('Request', requestSchema)

module.exports.Request = requestModel