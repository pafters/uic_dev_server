const smtp = require("../modules/smtp/SMTPModule");

class MailController {

    constructor() {
        this.subjects = {
            recovery: 'Восстановление пароля',
            changePassword: 'Пароль изменен'
        };
    }

    updPasswordNotice = async (email, password) => {
        const messageId = await smtp.sendMail(email, this.subjects.recovery, `Ваш новый пароль: ${password}`);
        if (messageId)
            return messageId
        else
            return false
    }

    sendRecoveryLink = async (email, link) => {
        const messageId = await smtp.sendMail(email, this.subjects.recovery,
            `Мы получили запрос на смену пароля от Вашего аккаунта.` +
            `Если это действительно Вы, и Вы хотите сменить свой пароль, пожалуйста, перейдите по ссылке ниже: \n\n ${link}`);
        if (messageId)
            return messageId
        else
            return false
    }

    changeQPasswordNotice = async (email, password) => {
        const messageId = await smtp.sendMail(email, this.subjects.changePassword, `Ваш пароль успешно изменен на: ${password}`);
        if (messageId)
            return messageId;
        else
            return false;
    }
}

module.exports = new MailController();