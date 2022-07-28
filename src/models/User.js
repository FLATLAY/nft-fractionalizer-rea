const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    trim: true
  },
  image: {
    type: String,
    required: false,
    default: `${process.env.DOMAIN}images/defaultProfile.webp`
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  registeredOn: {
    type: Number,
    required: true,
    default: (new Date()).getTime()
  }
  ,
  address: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { toObject: { virtuals: true } })

userSchema.virtual('stocks', {
  ref: 'Stock',
  localField: '_id',
  foreignField: 'owner'
})

userSchema.virtual('requests', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'owner'
})

userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ username: user.username }, process.env.SECRET_KEY)

  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

userSchema.statics.findByCredentials = async function (username, password) {
  const user = await this.findOne({ username })

  if (!user) {
    throw new Error('Username or password is wrong .')
  }
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Username or password is wrong .')
  }

  return user
}

userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

const userModel = new mongoose.model('User', userSchema)

module.exports.User = userModel