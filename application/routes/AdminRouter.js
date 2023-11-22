const Router = require('express');
const router = new Router();

const adminController = require('../controllers/AdminController');

const uploadFile = require('../middleware/uploadFiles');

router.post('/upload', uploadFile.single('file'), adminController.uploadFile); //авторизация
//router.get('/upload', adminController.authStatus); //проверка на авторизацию

module.exports = router;