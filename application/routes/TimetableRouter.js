const Router = require('express');
const router = new Router();

const timetableController = require('../controllers/TimetableController');

router.get('/programs', timetableController.getAllPrograms); //регистрация
router.get('/slots', timetableController.getSlots);
router.get('/sections', timetableController.getSections); //проверка на авторизацию
router.get('/events', timetableController.getEvents);
router.get('/speakers', timetableController.getSpeakers);
router.get('/speech/:id', timetableController.getSpeech);

module.exports = router;