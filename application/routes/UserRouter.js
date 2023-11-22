const Router = require('express');
const router = new Router();

const UserController = require('../controllers/UserController');


router.get('/login', UserController.qLogin);
router.get('/getMe', UserController.qGetMe);
router.get('/changePassword', UserController.changeQPassword);
router.get('/recovery/:token', UserController.qRecovery);
router.get('/sendRecoveryLink', UserController.sendRecoveryLink)
// router.get('/authStatus', userController.authStatus); //проверка на авторизацию

module.exports = router;