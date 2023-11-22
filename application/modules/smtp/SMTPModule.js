const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const { SMTP_PASSWORD, SMTP_USER, SMTP_HOST } = process.env

class SMTPModule {
    #transporter = null;

    constructor() {
        this.#transporter = this.#getTransporter();
    }

    #getTransporter() {
        return nodemailer.createTransport(smtpTransport({
            service: 'yandex',
            host: SMTP_HOST,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD
            },
        }))
    }

    async sendMail(reciever, subject, message) {
        const mailOptions = {
            from: SMTP_USER,
            to: reciever,
            subject: subject,
            text: message,
        };
        try {
            const info = await this.#transporter.sendMail(mailOptions);
            if (info)
                return info
        } catch (e) {
            return e;
        }
    }
}

module.exports = new SMTPModule();