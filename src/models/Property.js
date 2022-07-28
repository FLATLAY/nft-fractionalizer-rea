const mongoose = require('mongoose')

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 1
  },
  fractions: {
    type: Number,
    required: true,
    min: 1
  },
  propertyInfo: {
    type: String,
    required: true
  },
  createdOn: {
    type: Number,
    required: true,
    default: (new Date()).getTime()
  },
  tokenId: {
    type: Number,
    required: true,
    min: 1
  },
  images: [{
    image: {
      type: String,
      required: true
    }
  }],
  stocks: [{
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Stock'
    }
  }]
}, { toObject: { virutals: true } })

propertySchema.methods.stockExists = async function (ownerId, type, address) {
  const property = this

  await property.populate({
    path: 'stocks.stock',
    model: 'Stock'
  })

  const stock = property.stocks.find((stock) => {
    return stock.stock.owner.toString() === ownerId.toString() && stock.stock.type === type && stock.stock.address === address
  })

  return stock
}

propertySchema.methods.removeStock = async function (stockId) {
  const property = this

  await property.populate({
    path: 'stocks.stock',
    model: 'Stock'
  })

  property.stocks = property.stocks.filter((stock) => stock.stock._id.toString() !== stockId.toString())

  await property.save()
}

propertySchema.methods.addStock = async function (stock) {
  const property = this

  property.stocks = property.stocks.concat({ stock })

  await property.save()
}

const propertyModel = new mongoose.model('Property', propertySchema)

module.exports.Property = propertyModel