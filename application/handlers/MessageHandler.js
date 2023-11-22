const DBManager = require("../modules/db/DBManager");
const UserManager = require("../modules/user/UserManager");
const { Markup } = require('telegraf');

const fs = require('fs');
const TELEGRAM_COMPONENTS = require("../components/telegramComponents");
const { message } = require("telegraf/filters");

const { google } = require("googleapis");

class MessageHandler {
    constructor() {
        this.programIndex = 0;
        this.programs = [];
        this.followPrograms = [];
        this.followProgramIndex = 0;
        this.followProgramsBySlot = [];
        // this.slotId = 0;
        this.slotIndex = -1;
        this.event = null;
        this.followSlotName = '';
        this.isFollowKeybord = false;
        this.isCommentToSpeech = false;
        this.isQuestionToSpeech = false;
    }

    auth = async (ctx) => {
        ctx.update.message.chat.telegram_id = `${ctx.update.message.chat.id}`;

        const data = await UserManager.auth(ctx.update.message.chat);

        if (data.isReg) {
            await ctx.reply('Привет! Я бот для UIC DEV вечеринки. ' +
                'Правда здесь много народа? Я помогу тебе не потеряться.');
        }

        await this.getStarterKeybord(ctx);
    }

    getStarterMessage = async (ctx) => {
        await this.auth(ctx);
    }

    getStarterKeybord = async (ctx) => {
        this.slotIndex = -1;
        this.slotId = 0;
        await ctx.reply('Выбери пункт в меню', Markup
            .keyboard(TELEGRAM_COMPONENTS.starterKeybord)
            .resize()
        );
        this.isFollowKeybord = false;
    }

    getProgramKeybord = async (ctx) => {
        this.slotIndex = -1;
        await ctx.reply('Выбери пункт в меню', Markup
            .keyboard(TELEGRAM_COMPONENTS.programKeybord)
            .resize()
        );
        this.isFollowKeybord = false;
    }

    getSlots = async () => {
        const slots = await DBManager.getSlots();
        if (slots) {
            this.slots = slots;
            return slots;
        }
    }

    getProgramsList = async (ctx, isNow, time) => {
        if (!this.isFollowKeybord) {
            const slots = await this.getSlots();

            if (slots) {
                this.programIndex = 0;
                this.event = null;
                this.programs = [];

                if (isNow) {
                    this.slotIndex = 0;
                    if (!time) {
                        const date = new Date();
                        time = `${date.getHours() + 4}:${date.getMinutes()}`;

                        const slot = await DBManager.getSlotIdByTime(time);
                        if (slot) {
                            slots.forEach((element, index) => {
                                if (element.id == slot.id)
                                    this.slotIndex = index;
                            });
                        }
                    }
                    if (time) {
                        const slot = await DBManager.getSlotIdByTime(time);
                        slots.forEach((element, index) => {
                            if (element.id == slot.id)
                                this.slotIndex = index;
                        });
                    }
                } else {
                    if (this.slotIndex >= 0) {
                        this.slotIndex++;
                    } else {
                        this.getProgramsList(ctx, true);
                    }
                }
                if (this.slotIndex >= 0 && this.slotIndex < this.slots.length) {
                    const programs = await DBManager.getProgramsBySlotId(slots[this.slotIndex].id);
                    if (programs.length > 0) {
                        this.programs = programs;
                        this.getNextSpeech(ctx);
                    }
                    if (programs.length == 0) {
                        const event = await DBManager.getEventBySlotId(slots[this.slotIndex].id);
                        if (event) {
                            this.event = event;
                            this.getNextEvent(ctx);
                        } else {
                            this.getProgramsList(ctx, false);
                        }
                    }
                }
            }
        }
    }

    getNextEvent = async (ctx) => {
        if (this.event)
            await ctx.replyWithHTML(
                `${this.event?.slot?.name}` +
                `${this.event.location ? ', ' + this.event?.location : ''}\n\n` +
                `<b>${this.event?.name}</b>\n\n`
            );
    }

    getNextSpeech = async (ctx) => {
        if (!this.isQuestionToSpeech && !this.isCommentToSpeech) {
            const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
            const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;

            if (programIndex <= programs.length - 1) {

                let keyboard = [];
                if (!this.isFollowKeybord)
                    keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.programButtonsFrstRow, TELEGRAM_COMPONENTS.programButtonsScndRow]);
                else keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.followSpeechButtons, TELEGRAM_COMPONENTS.programButtonsScndRow]);

                if (!programs[programIndex]?.show)
                    keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.programButtonsScndRow]);

                await ctx.replyWithHTML(
                    `${programs[programIndex]?.slot?.name}` +
                    `${programs[programIndex]?.section?.location ? ', ' + programs[programIndex]?.section?.location : ''}` +
                    `${programs[programIndex]?.section?.name ? ', ' + programs[programIndex]?.section?.name : ''}\n\n` +
                    `<b>${programs[programIndex]?.speech?.speech_name}</b>\n\n` +
                    `${programs[programIndex]?.speech?.person?.name ? programs[programIndex]?.speech?.person?.name : ''}` +
                    `${programs[programIndex]?.speech?.person?.position ?
                        `,\n${programs[programIndex]?.speech?.person?.position}` : ''}` +
                    `${programs[programIndex]?.speech?.person?.company?.name ? ` @ ${programs[programIndex]?.speech?.person?.company?.name}` : ''}`,

                    { parse_mode: 'HTML', ...keyboard }
                );
                if (!this.isFollowKeybord)
                    this.programIndex++;
                else {
                    this.followProgramIndex++;
                }
            } else if (programIndex > programs.length - 1 && programs.length != 0) {
                ctx.reply('Докладов на это время больше нет.');
            }
        }

    }

    getSpeechInfo = async (ctx) => {
        const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs
        const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;

        let keyboard = [];
        if (!this.isFollowKeybord)
            keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.speechInfoButtonsFrstRow, TELEGRAM_COMPONENTS.programButtonsScndRow]);
        else keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.followSpeechInfoFrstRow, TELEGRAM_COMPONENTS.programButtonsScndRow]);

        try {
            await ctx.telegram.sendPhoto(ctx.chat.id, {
                source: fs.createReadStream(`${programs[programIndex - 1]?.speech?.person?.photo ? programs[programIndex - 1]?.speech?.person?.photo : 'upload/speaker.jpg'}`)
            },
                {
                    caption:
                        `${programs[programIndex - 1]?.slot?.name.replace(/\s{2,}/g, ' ').trimEnd()}` +
                        `${programs[programIndex - 1]?.section?.location ? ', ' + programs[programIndex - 1]?.section?.location.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.section?.name ? ', ' + programs[programIndex - 1]?.section?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}\n\n` +
                        `${programs[programIndex - 1]?.speech?.speech_name.replace(/\s{2,}/g, ' ').trimEnd()}\n\n` +
                        `${programs[programIndex - 1]?.speech?.person?.name ? programs[programIndex - 1]?.speech?.person?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.speech?.person?.position ?
                            `,\n${programs[programIndex - 1]?.speech?.person?.position.replace(/\s{2,}/g, ' ').trimEnd()}` : ''}` +
                        `${programs[programIndex - 1]?.speech?.person?.company?.name ? ` @ ${programs[programIndex - 1]?.speech?.person?.company?.name.replace(/\s{2,}/g, ' ').trimEnd()}` : ''}` +
                        `${programs[programIndex - 1]?.speech?.abstract ? `${programs[programIndex - 1]?.speech?.person?.company?.name ? `\n\n` : ``}${programs[programIndex - 1]?.speech?.abstract.replace(/<(.|\n)*?>/g, '').replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`,
                    parse_mode: 'HTML',
                    ...keyboard
                }
            )
        } catch (e) {
            await ctx.telegram.sendPhoto(ctx.chat.id, {
                source: fs.createReadStream(`${programs[programIndex - 1]?.speech?.person?.photo ? programs[programIndex - 1]?.speech?.person?.photo : 'upload/speaker.jpg'}`)
            },
                {
                    caption:
                        `${programs[programIndex - 1]?.slot?.name.replace(/\s{2,}/g, ' ').trimEnd()}` +
                        `${programs[programIndex - 1]?.section?.location ? ', ' + programs[programIndex - 1]?.section?.location.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.section?.name ? ', ' + programs[programIndex - 1]?.section?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}\n\n` +
                        `${programs[programIndex - 1]?.speech?.speech_name.replace(/\s{2,}/g, ' ').trimEnd()}\n\n` +
                        `${programs[programIndex - 1]?.speech?.person?.name ? programs[programIndex - 1]?.speech?.person?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.speech?.person?.position ?
                            `,\n${programs[programIndex - 1]?.speech?.person?.position.replace(/\s{2,}/g, ' ').trimEnd()}` : ''}` +
                        `${programs[programIndex - 1]?.speech?.person?.company?.name ? ` @ ${programs[programIndex - 1]?.speech?.person?.company?.name.replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`
                },
            );
            await ctx.replyWithHTML(
                `${programs[programIndex - 1]?.speech?.abstract ? `${programs[programIndex - 1]?.speech?.person?.company?.name ? `\n\n` : ``}${programs[programIndex - 1]?.speech?.abstract.replace(/<(.|\n)*?>/g, '').replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`,
                { parse_mode: 'HTML', ...keyboard }
            );
        }
    }

    getSpeechLocation = async (ctx) => {
        const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
        const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;
        await ctx.replyWithHTML(
            `${programs[programIndex - 1]?.section?.location ? programs[programIndex - 1]?.section?.location : ''}` +
            `${programs[programIndex - 1]?.section?.description ? ', \n\n' + programs[programIndex - 1]?.section?.description.replace(/<(.|\n)*?>/g, '') : ''}`
        );
    }

    setMarkToSpeech = async (ctx, markName, mark) => {
        if (this.isFollowKeybord)
            DBManager.setMarkToSpeech(ctx.update.callback_query.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.speech?.id, markName, mark);
        else
            DBManager.setMarkToSpeech(ctx.update.callback_query.from.id, this.programs[this.programIndex - 1]?.speech?.id, markName, mark);
    }

    getMarkToSpeechMessage = async (ctx, num) => {
        const keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.marksButtons(num)]);

        switch (num) {
            case 1: {
                await ctx.replyWithHTML(
                    `Оцени содержание доклада`, // "${this.programs[this.programIndex - 1]?.speech?.speech_name.replace(/\s{2,}/g, ' ').trimEnd()}
                    { parse_mode: 'HTML', ...keyboard }
                );
                break;
            }
            case 2: {
                await ctx.replyWithHTML(
                    `Оцени подачу доклада`,
                    { parse_mode: 'HTML', ...keyboard }
                );
                break;
            }
        }

    }

    getMarkToFollowSpeechMessage = async (ctx, num) => {
        const keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.marksButtons(num)]);

        switch (num) {
            case 1: {
                await ctx.replyWithHTML(
                    `Оцени содержание доклада`,
                    { parse_mode: 'HTML', ...keyboard }
                );
                break;
            }
            case 2: {
                await ctx.replyWithHTML(
                    `Оцени подачу доклада`,
                    { parse_mode: 'HTML', ...keyboard }
                );
                break;
            }
        }

    }

    sendMessageToSpeechComment = async (ctx) => {
        const keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.speechCommentButtons]);
        await ctx.replyWithHTML(
            `Хочешь оставить комментарий?`,
            { parse_mode: 'HTML', ...keyboard }
        );
    }


    sendMessageToSpeechQuestion = async (ctx) => {
        const keyboard = Markup.inlineKeyboard([TELEGRAM_COMPONENTS.speechQuestionButtons]);;
        await ctx.replyWithHTML(
            `Хочешь задать вопрос спикеру?`,
            { parse_mode: 'HTML', ...keyboard }
        );
    }

    setCommentToSpeech = async (ctx, comment) => {
        if (this.isCommentToSpeech) {
            ctx.reply('Хорошо, я передам его спикеру');
            if (!this.isFollowKeybord) {
                await DBManager.setCommentToSpeech(ctx.update.message.from.id, this.programs[this.programIndex - 1]?.speech?.id, comment);
            } else {
                await DBManager.setCommentToSpeech(ctx.update.message.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.speech?.id, comment);
            }
        }

    }


    //
    async NodeGoogleSheets(file, sheetId, keyMass, fun) {
        const auth = new google.auth.GoogleAuth({
            keyFile: file,
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });
        //
        (async () => {
            const client = await auth.getClient();
            //
            const googleSheets = google.sheets({ version: "v4", auth: client });
            //
            const spreadsheetId = sheetId;
            //
            const metaData = await googleSheets.spreadsheets.get({
                auth,
                spreadsheetId,
            });
            //
            const data = {
                auth,
                spreadsheetId,
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: keyMass.change,
                },
            }
            //
            if (keyMass.append) {
                data['range'] = keyMass.append;
                //
                const append = await googleSheets.spreadsheets.values.append(data);
                //
                fun(append);
            } else if (keyMass.values) {
                data['range'] = keyMass.values;
                //
                delete data.valueInputOption; delete data.resource;
                //
                const values = await googleSheets.spreadsheets.values.get(data);
                //
                fun(values);
            } else if (keyMass.update) {
                data['range'] = keyMass.update;
                //
                const update = await googleSheets.spreadsheets.values.update(data);
                //
                fun(update);
            }
        })();
    }
    //

    sendQuestionToSpeech = async (ctx, text) => {
        const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
        const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex
        ctx.reply('Хорошо, я передам его спикеру');

        const user = ctx.update.message.from;
        try {
            this.NodeGoogleSheets('application/handlers/googleKey.json', process.env.GOOGLE_TABLE_URL, {
                append: programs[programIndex - 1].section.name,
                change: [[programs[programIndex - 1].speech.name, user?.first_name, user?.last_name, text]]
            }, (data) => {
            })

            await DBManager.setQuestionToSpeech(ctx.update.message.from.id, programs[programIndex - 1]?.id, text);
        } catch (e) {
            console.log(e);
        }


        this.isQuestionToSpeech = false;
    }

    getSlotsKeybord = async (ctx) => {
        this.slotIndex = -1;
        const slots = await DBManager.getSlots();
        const buttons = [];
        if (slots) {
            let j = 0;
            buttons[j] = [];
            buttons[j].push({ text: '📋 Программа' });
            slots.forEach(async (slot, i) => {
                buttons[j].push({ text: slot.name });
                if (buttons[j].length == 3) {
                    j++;
                    buttons[j] = [];
                }
                if (i == slots.length - 1)
                    await ctx.reply('Выбери пункт в меню', Markup
                        .keyboard(buttons)
                        .resize()
                    );
            });
        }
        this.isFollowKeybord = false;
    }

    getSectionsKeybord = async (ctx) => {
        this.slotIndex = -1;
        const sections = await DBManager.getSections();
        const buttons = [];
        if (sections) {
            let j = 0;
            buttons[j] = [];
            buttons[j].push({ text: '📋 Программа' });
            sections.forEach(async (section, i) => {
                buttons[j].push({ text: section.name });
                if (buttons[j].length == 3) {
                    j++;
                    buttons[j] = [];
                }
                if (i == sections.length - 1)
                    await ctx.reply('Выбери пункт в меню', Markup
                        .keyboard(buttons)
                        .resize()
                    );
            });
        }
        this.isFollowKeybord = false;
    }

    getProgramsBySectionId = async (ctx, sectionId) => {
        const programs = await DBManager.getProgramsBySectionId(sectionId);

        if (programs) {
            this.programs = programs;
            this.programIndex = 0;
            this.getNextSpeech(ctx, true);
        }

    }

    getFollowProgramsBySlot = async (ctx, slotName) => {
        if (!this.isCommentToSpeech && !this.isQuestionToSpeech) {
            if (this.isFollowKeybord) {
                this.followProgramIndex = 0;
                const programs = []
                if (slotName)
                    this.followSlotName = slotName;
                this.followPrograms.forEach(schedule => {
                    if (schedule.program.slot.name == this.followSlotName)
                        programs.push(schedule.program);
                })
                this.followProgramsBySlot = programs;
                this.getNextSpeech(ctx);
            } else {
                this.getStarterKeybord(ctx);
            }
        }
    }

    getFollowSlotsKeybord = async (ctx, telegramId) => {
        this.slotIndex = -1;
        const followPrograms = await DBManager.getFollowPrograms(telegramId);
        if (followPrograms) {

            const allSlots = [];
            followPrograms.forEach(async (schedule, i) => {
                allSlots.push(schedule.program.slot.name);
            });

            const uniqueSlots = [...new Set(allSlots)];

            this.followPrograms = followPrograms;
            this.isFollowKeybord = true;

            const buttons = [];
            let j = 0;
            buttons[j] = [];
            buttons[j].push({ text: '↩️ Главное меню' });

            for (let i = 0; i < uniqueSlots.length; i++) {
                buttons[j].push({ text: uniqueSlots[i] });
                if (buttons[j].length == 3) {
                    j++;
                    buttons[j] = [];
                }
            };


            await ctx.reply('Выбери пункт в меню', Markup
                .keyboard(buttons)
                .resize()
            );
        }
    }

    getConfInfo = async (ctx) => {
        await ctx.reply(`Добро пожаловать на UIC dev. \n` +
            `Я — бот конференции, @uic_dev_bot. \n\n` +

            `Обязательно подпишись на канал @uicdev — там будут самые свежие анонсы — и вступи в чат @uic_dev — там будет самое горячее общение. \n\n` +

            `Ещё полезные ссылки: https://uic.dev/ — официальный сайт конференции, https://vk.com/uicdev — группа ВК, https://conf23.uic.dev/ — прямая ссылка на программу. \n\n` +

            `В боте можно посмотреть программу по секциям и по времени, добавить себе в избранное интересующие доклады и составить собственное расписание.\n` +
            `На каждый доклад можно отправить свой вопрос и поставить оценку спикеру. \n\n` +

            `Получили пищу для ума — надо подкрепиться.\n` +
            `Фудкорт от Welcome group с азиатской кухней работает на 1 этаже у гардероба. Слева от Интеграла примерно в 200 м. в кафе Libre bar – шашлык, салаты, хачапури, пицца.\n\n` +

            `И самое главное — туалет находится на 1 этаже Интеграла рядом с лестницей.`
        );

        await ctx.reply(`Послушали доклады, поели — пришло время развлечений. \n\n` +

            `В перерывах между докладами на стенде Координационного центра доменов .RU/.РФ проходит викторина «Изучи Интернет - управляй им!» с призами для победителей и памятными сувенирами для всех участников.\n` +
            `Компания DexSys приготовила для вас разнообразные активности:\n` +
            `Кофе для Profi — будут раздавать кофе (а также чай, какао и горячий шоколад) для таких профи, как вы. Ищите стенд DexSys в переходе на 2 этаже и получите свой стаканчик бодрости.\n` +
            `Там же решайте логические задачки и участвуйте в розыгрыше классного бокса с мерчем.\n\n` +

            `Хотите повысить свои шансы на успех и получить еще больше подарков от DexSys? Ловите Рысь (сегодня по UIC Dev гуляет маскот компании DexSys - Рысь Декси), делайте с ней фото, загружайте его с хэштегом #dexsys_uicdev в соц сети и ждите результатов розыгрыша! Победителя выберут с помощью рандомайзера в 17:40 у стенда с кофе.\n\n` +

            `В 14:00 в секции Dev Talks (холл перехода 1 этажа) пройдёт зажигательная тренировка с контролем пульса и сожженных калорий от DexBee. Предварительная запись на тренировку осуществляется на стенде с кофе до 13:30. Приходите размяться, проверить свою физическую форму и узнать больше о продукте DexSys. А за лучшие показатели вы сможете получить полезный фитнес-подарок (за призы поборются только первые 20 участников, успей записаться!).\n\n` +

            `В 19:30, сразу после закрытия конференции, начнётся открытый турнир «60 секунд Ижевск» среди ИТ-команд. Собери команду до 6 человек и зарегистрируй её по ссылке https://docs.google.com/forms/d/e/1FAIpQLScO9mg1BBKp0i1Q1g0wZHjZyxJuBcvO8UVDTBW7xdg0NYgybQ/viewform. Или найди в чате конференции команду, которой не хватает игроков.\n\n` +

            `В 20:00 начнётся огненная вечеринка. До 24:00 мы успеем разыграть призы, потанцевать под кавер-группу «День бороды» и диджея, а также наведаться в бар. Ну и, конечно, пообщаться с новыми и старыми друзьями!`
        );
        await ctx.reply(`
        Не забывайте выкладывать ваши впечатления о конференции с хэштегом #uicdev2023.\nУ большого прессволла UIC dev можно примерить наши фирменные ушки и даже голову кролика.После мероприятия будут подарки за лучшее фото и за лучший отчёт о конференции.
        `);

    }

    async getNav(ctx) {
        await ctx.replyWithPhoto({
            source: fs.createReadStream('upload/nav.jpg')
        });
    }

    followSpeech = async (ctx) => {
        const followSpeech = await DBManager.setFollowSpeech(ctx.update.callback_query.from.id, this.programs[this.programIndex - 1]?.id);
        if (followSpeech)
            ctx.reply(`Ты добавил доклад "${this.programs[this.programIndex - 1]?.speech?.speech_name.replace(/\s{2,}/g, ' ').trimEnd()}" в свое расписание`);
        else ctx.reply(`Доклад "${this.programs[this.programIndex - 1]?.speech?.speech_name.replace(/\s{2,}/g, ' ').trimEnd()}" уже находится в твоем в списке`);
    }

    unfollowSpeech = async (ctx) => {
        const isRemoved = await DBManager.removeFollowSpeech(ctx.update.callback_query.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.id);
        if (isRemoved) {
            ctx.reply(`Доклад был успешно удален`);
            this.getFollowSlotsKeybord(ctx, ctx.update.callback_query.from.id);
        } else ctx.reply(`Похоже, что доклад уже удален`);
    }
}

module.exports = new MessageHandler();