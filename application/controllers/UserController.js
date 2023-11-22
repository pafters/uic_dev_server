const UserManager = require('../modules/user/UserManager');
const MailController = require('./MailController');

class UserController {

    async logup(req, res) {

    }

    async qRecovery(req, res) {
        try {
            const data = await UserManager.qRecovery(req.body.password, req.params.token);
            if (data)
                res.status(data.status).send(data.msg);
        } catch (e) {
            res.status(500).send(e); //что то пошло не так
        }
    }

    async changeQPassword(req, res) {
        try {
            const { login, oldPassword, newPassword } = req.body;
            const data = await UserManager.checkPassword(login, oldPassword);

            if (data.status == 200) {
                const passwLogs = await UserManager.changeQPassword(login, newPassword);

                if (passwLogs) {
                    res.status(passwLogs.status).send(passwLogs.msg);
                }
            } else {
                res.status(data.status).send(data.msg);  //пароль не совпал
            }

        } catch (e) {
            res.status(500).send(false); //что то пошло не так
        }
    }

    async qLogin(req, res) {
        try {
            const { login, password } = req.body;
            const data = await UserManager.qLogin(login, password);
            if (data)
                res.status(data.status).send(data.msg);
        } catch (e) {
            res.status(500).json(e);
        }
    }

    async qGetMe(req, res) {
        const token = req.headers.authorization;
        //const { token } = req.body;
        const decodeToken = UserManager.decodeToken(token);
        const data = await UserManager.qGetMe(decodeToken.email);
        if (data) {
            res.status(data.status).send(data.msg);
        }
    }

    async sendRecoveryLink(req, res) {
        try {
            const { email } = req.body;
            const data = await UserManager.generateRecoveryLink(email);
            if (data.link) {
                const messageId = await MailController.sendRecoveryLink(email,
                    req.protocol + '://' + req.get('host') + '/recovery/?token=' + data.link);
                if (messageId) {
                    res.status(data.status).send(data.msg);
                }
            }
            else res.status(data.status).send(data.msg);
        } catch (e) {
            res.status(500).send(e);
        }
    }
}

module.exports = new UserController();