const mongoose = require('mongoose')
const { Property } = require('./Property')

const stockSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  value: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    default: 'unlisted'
  },
  address: {
    type: String,
    required: true
  }
}, { toObject: { virtuals: true } })

stockSchema.virtual('property', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'stocks.stock',
  justOne: true
})

const stockModel = new mongoose.model('Stock', stockSchema)

module.exports.Stock = stockModel