const multer = require('multer');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'upload/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}` + '-' + file.originalname)
    }
})

module.exports = multer({ storage });