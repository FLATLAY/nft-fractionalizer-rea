const multer = require('multer')
const path = require('path')
const fs = require("fs")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let storagePath = ''
    if (path.extname(file.originalname) === '.json')
      storagePath = path.resolve(__dirname, '../../', process.env.PROPERTIES_INFO_DIR)
    else
      storagePath = path.resolve(__dirname, '../../', process.env.PROFILES_PROPERTIES_DIR)

    fs.mkdirSync(storagePath, { recursive: true })
    cb(null, storagePath)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage
})

module.exports.uploadMiddleware = upload