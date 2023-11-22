const Router = require('express');
const router = new Router();

const UserRouter = require('./UserRouter');
const AdminRouter = require('./AdminRouter');
const TimetableRouter = require('./TimetableRouter');

router.use('/user', UserRouter);
router.use('/timetable', TimetableRouter)
router.use('/admin', AdminRouter);

module.exports = router;