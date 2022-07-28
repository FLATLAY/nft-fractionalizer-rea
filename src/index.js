const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const express = require('express')
const dotenv = require('dotenv')
const path = require('path')

// Paths
const staticFilesDirectory = path.resolve(__dirname, '../public')

// Routers
const { authenticationRouter } = require('./routers/authentication')
const { marketplaceRouter } = require('./routers/marketplace')
const { propertyRouter } = require('./routers/property')
const { stockRouter } = require('./routers/stock')
const { userRouter } = require('./routers/user')
const { generalRouter } = require('./routers/general')

// CONFIG dotenv
dotenv.config()

// Setting up application and configuring app
const app = express()

app.use(express.static(staticFilesDirectory))
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())
app.set('view engine', 'ejs')

app.use(authenticationRouter)
app.use(marketplaceRouter)
app.use(propertyRouter)
app.use(stockRouter)
app.use(userRouter)
app.use(generalRouter)

// Configuring mongoose
const { PORT, SECRET } = process.env
const databaseName = 'FractionalizerDemo'
const databaseURL = `mongodb://127.0.0.1:27017/${databaseName}`

app.listen(PORT, () => {

  console.log(`Server is running : http://localhost:${PORT}`)

  mongoose.connect(databaseURL, { useNewUrlParser: true }, () => {
    console.log('Connected to database .')
  })
})
