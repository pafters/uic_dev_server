const { User } = require('../../models/models');
const DBManager = require('../db/DBManager');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const MailController = require('../../controllers/MailController');

class UserManager {

    constructor() {
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    auth = async ({ telegram_id, first_name, last_name, username }) => {
        let user = await User.findOne({ where: { telegram_id: telegram_id } });
        let isReg = false;
        if (!user) {
            await User.create({ telegram_id, first_name, last_name, username });
            user = await User.findOne({ where: { telegram_id: telegram_id } });
            isReg = true;
        }
        const payload = {
            telegram_id: user.telegram_id,
            id: user.id,
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        return { isReg, user, token: token };
    }

    generateHashPassword = async (req, res) => {
        const qusers = await DBManager.getQusers();
        if (qusers) {

        }
    }

    generatePassword = async () => {
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += this.characters.charAt(Math.floor(Math.random() * this.characters.length));
        }
        const hashPassword = await bcrypt.hash(`${password}`, 8);
        return { password, hashPassword };
    }

    // Сделать авторизацию на сайте по логину/паролю, в качестве логина - мейл, в качестве пароля - штрихкод билета (12-значное число).
    qLogin = async (login, password) => {
        const qUser = await DBManager.getQuser(login);
        if (qUser) {
            const result = await bcrypt.compare(`${password}`, `${qUser.password.trim()}`);
            if (result) {
                //пароль совпал
                const payload = {
                    email: qUser.email,
                    name: qUser.name,
                    id: qUser.id,
                    access23: qUser.access23
                }
                const token = jwt.sign(payload, process.env.JWT_SECRET);

                return {
                    msg: {
                        token,
                        userData: {
                            email: qUser.email,
                            name: qUser.name,
                            access23: qUser.access23
                        }
                    },
                    status: 200
                };
            } else {
                return {
                    msg: { err: 'Неправильный пароль' },
                    status: 401
                };
            }
        } else {
            return {
                msg: { err: 'Пользователь с таким логином не найден' },
                status: 401
            };

        }
    }

    qRecovery = async (newPassword, link) => {
        const recoveryLink = await DBManager.getQuserByLink(link);
        if (recoveryLink) {
            const currentTime = new Date();

            const diff = (currentTime - recoveryLink.createdAt) / 60000;
            const qUser = await DBManager.getQuser(recoveryLink.quser.login);
            if (qUser) {
                if (diff <= 60) {
                    qUser.password = await bcrypt.hash(`${newPassword}`, 8);
                    const messageId = await MailController.changeQPasswordNotice(qUser.login, newPassword)

                    if (messageId) {
                        await qUser.save();
                        await DBManager.deleteRecoveryLink(qUser.id);
                        return {
                            msg: { ok: 'Пароль успешно обновлен' },
                            status: 200
                        };
                    }

                } else {
                    await DBManager.deleteRecoveryLink(qUser.id);
                    return {
                        msg: { err: 'Срок действия ссылки подошел к концу' },
                        status: 404
                    };
                }
            } else {
                return {
                    msg: { err: 'Пользователь с такой почтой не найден' },
                    status: 401
                };
            }
        } else {
            return {
                msg: { err: 'Ссылки не существует' },
                status: 404
            }
        }
    }

    async checkPassword(login, password) {
        const qUser = await DBManager.getQuser(login);
        if (qUser) {
            const isCorrect = await bcrypt.compare(`${password}`, `${qUser.password.trim()}`);
            if (isCorrect) {
                return {
                    status: 200
                };
            }
        } else {
            return {
                msg: { err: 'Пользователь с такой почтой не найден' },
                status: 401
            };
        }
    }

    generateRecoveryLink = async (login) => {
        const qUser = await DBManager.getQuser(login);
        if (qUser) {
            const link = crypto.randomBytes(16).toString('hex');

            const linkIsFree = await DBManager.checkRecoveryLink(link);

            if (linkIsFree) {
                await DBManager.insertRecoveryLink(qUser.id, link);
                return {
                    link,
                    msg: { ok: 'Письмо с ссылкой на восстановление пароля отправлено на почту' },
                    status: 200
                };
            } else {
                this.generateRecoveryLink(login);
            }
        } else return {
            msg: { err: 'Пользователь с такой почтой не найден' },
            status: 401
        };
    }

    changeQPassword = async (login, newPassword) => {
        const qUser = await DBManager.getQuser(login);
        if (qUser) {
            const hashPassword = await bcrypt.hash(`${newPassword}`, 8);
            qUser.password = hashPassword;

            await qUser.save();

            try {
                const messageId = await MailController.changeQPasswordNotice(login, newPassword)
                if (messageId)
                    return {
                        msg: { ok: 'Ваш пароль успешно изменен на: ' + newPassword },
                        status: 200
                    };
            } catch (e) {
                return e;
            }

        } else {
            return {
                msg: { err: 'Пользователь с такой почтой не найден' },
                status: 401
            };
        }
    }

    decodeToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    async qGetMe(login) {
        const qUser = await DBManager.getQuser(login);
        if (qUser) {
            //пароль совпал
            const userData = {
                email: qUser.email,
                name: qUser.name,
                access23: qUser.access23
            }

            return {
                msg: { userData },
                status: 200
            };

        } else {
            return {
                msg: { err: 'Пользователь с таким логином не найден' },
                status: 401
            };

        }

    }

}

module.exports = new UserManager();