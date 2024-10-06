
const DBManager = require('../modules/db/DBManager');

class TimetableController {

    async getEvents(req, res) {
        //Получаем все общие события (Перерывы, обеды)
        const events = await DBManager.getEvents();
        if (events)
            res.status(200).json(events);
        else
            res.status(500)
        //Отсортированы в порядке возрастания
    }

    async getSlots(req, res) {
        const slots = await DBManager.getSlots();

        if (slots)
            res.status(200).json(slots);
        else
            res.status(500)
        //Отсортированы в порядке возрастания
    }

    async getSections(req, res) {
        try {
            const sections = await DBManager.getSections();

            if (sections) {
                res.json(sections);
            }

        } catch (err) {
            res.status(500);
        }
        //все поля, что есть в бд. Те, что с id, раскрыть полным объектом
    }

    async getDates(req, res) {
        try {
            const dates = await DBManager.getDates();

            if (dates) {
                res.json(dates);
            }

        } catch (err) {
            res.status(500);
        }
        //все поля, что есть в бд. Те, что с id, раскрыть полным объектом
    }

    async getSpeech(req, res) {
        try {
            const data = await DBManager.getSpeech(req.params.id);
            const { speech, program } = data;
            if (speech) {
                res.status(200).json({ speech, program });
            }
        } catch (err) {
            res.status(500);
        }

    }

    async getSpeakers(req, res) {
        try {
            const programs = await DBManager.getSpeakers();
            if (programs) {
                res.status(200).json(programs)
            }

        } catch (err) {
            res.status(500);
        }
    }

    async getAllPrograms(req, res) {
        try {
            const programs = await DBManager.getAllPrograms();
            if (programs) {
                res.status(200).json(programs)
            }

        } catch (err) {
            res.status(500);
        }
        //Аналогично все раскрытые поля: section, slot, speech
        //Фильтрация по секциям, отправлять буду массивом из id 
        //Для создания общих событий (типа перерывов, обедов) можно создавать программу без указания секции
    }

}

module.exports = new TimetableController();