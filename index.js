require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.SERVER_PORT || 5000;
const cors = require('cors');
const sequelize = require('./application/modules/db/DB');

const bodyParser = require('body-parser');

const baseRouter = require('./application/routes/BaseRouter');

const { adminBro, router } = require('./application/modules/adminBro/adminBro');
const path = require('path');

const botRouter = require('./application/routes/BotRouter');

//enables cors
app.use(express.json());
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));

app.use('/api', baseRouter);
app.use(adminBro.options.rootPath, router);
app.use(bodyParser.json());
app.use('/api/upload', express.static(path.join(__dirname, 'upload')))

app.get('/api/', (req, res) => {
    res.status(200).json({ message: 'All right!' })
});

// Создание GET маршрута
app.get('/express_backend', (req, res) => {
    res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' });
});

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
}

start();