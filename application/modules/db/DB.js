const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
    process.env.DB_DATABASE, //название бд
    process.env.DB_USERNAME, //имя пользователя
    process.env.DB_PASSWORD, //пароль
    {
        dialect: 'postgres',
        host: process.env.DB_HOST, //хост подключения
        port: process.env.DB_PORT
    }
)