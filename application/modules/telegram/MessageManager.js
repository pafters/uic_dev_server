const DBManager = require("../db/DBManager");
const UserManager = require("../user/UserManager");
const { Markup } = require('telegraf');

const fs = require('fs');
const COMPONENTS = require("../../components/telegramComponents");
const { message } = require("telegraf/filters");

const { google } = require("googleapis");
const moment = require("moment");
const { createCollage } = require("./PhotoManager");
const path = require("path");

class MessageManager {
    constructor() {
        this.programIndex = 0;
        this.programs = [];
        this.followPrograms = [];
        this.followProgramIndex = 0;
        this.followProgramsBySlot = [];
        this.slotIndex = -1;
        this.event = null;
        this.followSlotName = '';
        this.isFollowKeybord = false;
        this.isCommentToSpeech = false;
        this.isQuestionToSpeech = false;
        this.exMessage = null;
        this.exSpeech = null;
        this.exRequestDate = new Date();
        this.cancelInProgress = false;
        this.currentMenu = null;
        this.currentDate = null;
    }

    auth = async (ctx) => { //Авторизация
        try {
            this.cancelInProgress = true;
            ctx.update.message.chat.telegram_id = `${ctx.update.message.chat.id}`;

            const data = await UserManager.auth(ctx.update.message.chat);

            if (data.isReg) {
                await ctx.reply('Привет! Я бот для UIC DEV вечеринки. ' +
                    'Правда здесь много народа? Я помогу тебе не потеряться.');
            }

            await this.getStarterKeybord(ctx);
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }

    }

    getStarterMessage = async (ctx) => {
        await this.auth(ctx);
    }

    getStarterKeybord = async (ctx) => { //Начальные пункты меню
        try {
            this.cancelInProgress = true;
            this.slotIndex = -1;
            this.slotId = 0;
            await ctx.reply('Выбери пункт в меню', Markup
                .keyboard(COMPONENTS.STARTER_KEYBOARD)
                .resize()
            );
            this.isFollowKeybord = false;
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getProgramKeybord = async (ctx) => { //меню по программам
        try {
            this.cancelInProgress = true;
            this.slotIndex = -1;
            await ctx.reply('Выбери пункт в меню', Markup
                .keyboard(COMPONENTS.PROGRAM_KEYBOARD)
                .resize()
            );
            this.isFollowKeybord = false;
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }



    cancelMessage = async (ctx, state) => {
        this.isCommentToSpeech = false;
        this.isQuestionToSpeech = false;
        this.cancelInProgress = true;
        try {
            if (this.exSpeech && state === 'speech' || state === 'all') {
                if (this.exSpeech?.reply_markup && this.exSpeech?.reply_markup?.inline_keyboard[0]) {
                    await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exSpeech?.message_id, null, Markup.inlineKeyboard([]));
                    this.exSpeech = null;
                }
            }

            if (this.exMessage && state === 'message' || state === 'all') {
                if (this.exMessage?.reply_markup && this.exMessage?.reply_markup?.inline_keyboard[0]) {
                    await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exMessage?.message_id, null, Markup.inlineKeyboard([]));
                    this.exMessage = null;
                }
            }
        } catch (e) {
            this.cancelInProgress = false;
            console.log(e);
        }
    }

    getSlots = async () => { //меню со списком времени
        try {
            this.cancelInProgress = true;
            const events = await DBManager.getEventsByDate(this.currentDate);
            const programs = await DBManager.getProgramsByDate(this.currentDate);
            if (events && programs) {
                const slots = [...new Set([...events, ...programs].map(el => {
                    if (el.slot?.name) {
                        return el.slot
                    }
                }))].filter((value, index, self) =>
                    index === self.findIndex((t) => (
                        t.id === value.id
                    ))).sort((a, b) => {
                        const timeA = a.name; // Извлекаем время начала из строки
                        const timeB = b.name;

                        // Сравниваем время начала, преобразуя в формат HH:MM
                        const timeAParts = timeA.split(':').map(Number);
                        const timeBParts = timeB.split(':').map(Number);
                        if (timeAParts[0] !== timeBParts[0]) {
                            return timeAParts[0] - timeBParts[0];
                        } else {
                            return timeAParts[1] - timeBParts[1];
                        }
                    });
                if (slots) {
                    this.slots = slots;
                    return slots;
                }
            }

        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours === 0 ? 24 : hours) * 60 + minutes;
    };

    getSlotByTime = (time, time_end) => {
        if (this.slots.length > 0) {
            let closestSlot = null;
            let closestDiff = Infinity;
            for (let slot of this.slots) {
                const startTimeMinutes = this.timeToMinutes(slot.time_start);
                const endTimeMinutes = this.timeToMinutes(slot.time_end);

                const targetTimeMinutes = this.timeToMinutes(time);
                if (time_end) {
                    const targetTimeEndMinutes = this.timeToMinutes(time_end);

                    if (startTimeMinutes === targetTimeMinutes && endTimeMinutes === targetTimeEndMinutes) {
                        closestSlot = slot;
                        break;
                    }
                }
                else {
                    if (targetTimeMinutes >= startTimeMinutes && targetTimeMinutes < endTimeMinutes) {
                        closestSlot = slot;
                        break;
                    }
                    const diffToStart = Math.abs(targetTimeMinutes - startTimeMinutes);
                    if (diffToStart < closestDiff) {
                        closestDiff = diffToStart;
                        closestSlot = slot;
                    }
                }
            };
            return closestSlot;
        } else {
            return false;
        }

    }


    getProgramsList = async (ctx, isNow, time, time_end) => { //список программ по времени либо по категории
        try {
            this.cancelInProgress = true;
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
                            time = `${date.getHours() + 4}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
                            const closestSlotTime = this.getSlotByTime(time);
                            if (closestSlotTime) {
                                const slot = closestSlotTime;// await DBManager.getSlotIdByTime(time);
                                if (slot) {
                                    slots.forEach((element, index) => {
                                        if (element.id == slot.id)
                                            this.slotIndex = index;
                                    });
                                }
                            } else {
                                await ctx.reply('На это время нет событий');
                                return false;
                            }

                        }
                        else if (time) {
                            const closestSlotTime = this.getSlotByTime(time, time_end);
                            if (closestSlotTime) {
                                const slot = closestSlotTime;//await DBManager.getSlotIdByTime(time);

                                slots.forEach((element, index) => {
                                    if (element.id == slot.id) {
                                        this.slotIndex = index;
                                    }
                                });
                            }
                        }
                    } else {
                        if (this.slotIndex >= 0 && this.slotIndex <= this.slots.length) {
                            this.slotIndex++;
                            if (this.slotIndex === this.slots.length) {
                                await ctx.reply('На это время нет событий');
                                return false;
                            }
                        }
                        else {
                            await this.getProgramsList(ctx, true);
                            return false;
                        }
                    }
                    if (this.slotIndex >= 0 && this.slotIndex < this.slots.length) {
                        const programs = await DBManager.getProgramsBySlotId(slots[this.slotIndex].id, this.currentDate);
                        if (programs.length > 0) {
                            const filtredPrograms = programs.filter(program =>
                                program.day && program.day.name === this.currentDate
                            );
                            if (filtredPrograms) {
                                this.programs = filtredPrograms;
                                await this.getNextSpeech(ctx);
                            }
                        } else if (programs.length == 0) {
                            const event = await DBManager.getEventBySlotId(slots[this.slotIndex].id, this.currentDate);
                            if (event) {
                                if (event.day?.name === this.currentDate) {
                                    this.event = event;
                                    await this.getNextEvent(ctx);
                                }
                                else {
                                    await this.getProgramsList(ctx, false);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            this.cancelInProgress = false;
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getNextEvent = async (ctx) => { //получение следующего общего события
        try {
            this.cancelInProgress = true;
            if (this.event) {
                const data = await ctx.replyWithHTML(
                    `${this.event?.slot?.name}` +
                    `${this.event.location ? ', ' + this.event?.location : ''}\n\n` +
                    `<b>${this.event?.name}</b>\n\n`
                );
                this.exSpeech = data;
            }
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getNextSpeech = async (ctx) => { //получение следующего доклада
        try {
            this.cancelInProgress = true;
            if (!this.isQuestionToSpeech && !this.isCommentToSpeech) {
                const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
                const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;

                if (programIndex <= programs.length - 1) {
                    let keyboard = [];
                    if (!this.isFollowKeybord)
                        keyboard = Markup.inlineKeyboard(COMPONENTS.CALLBACKS.PROGRAM);
                    else keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.FOLLOW, COMPONENTS.CALLBACKS.PROGRAM[1]]);

                    if (!programs[programIndex]?.show)
                        keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.PROGRAM[1]]);
                    const data = await ctx.replyWithHTML(
                        `${programs[programIndex]?.slot?.name}` +
                        `${programs[programIndex]?.section?.location ? ', ' + programs[programIndex]?.section?.location : ''}` +
                        `${programs[programIndex]?.section?.name ? ', ' + programs[programIndex]?.section?.name : ''}\n\n` +
                        `<b>${programs[programIndex]?.speech?.name}</b>\n\n` +
                        `${programs[programIndex]?.speech?.assignments ? programs[programIndex]?.speech?.assignments.map(assignment =>
                            (assignment.person.name ? `${assignment.person.name} \n` : '') +
                            (assignment.person?.position ? `${assignment.person?.position}` : '') +
                            (assignment.person?.company?.name ? ` @ ${assignment.person?.company?.name} \n` : '')).join('\n') : ''}`,

                        { parse_mode: 'HTML', ...keyboard }
                    );
                    if (!this.isFollowKeybord)
                        this.programIndex++;
                    else {
                        this.followProgramIndex++;
                    }
                    this.exSpeech = data;
                } else if (programIndex > programs.length - 1 && programs.length != 0) {
                    ctx.reply('Докладов на это время больше нет.');
                }
            }
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
            this.cancelInProgress = false;
        }
    }

    switchStateAskQuestion = async (ctx, state) => {
        this.addQuestionBttn(ctx);
        this.isQuestionToSpeech = state;
        ctx.reply(state ? 'Напиши, что хочешь спросить' : 'Хорошо');
    }

    switchStateComment = async (ctx, state) => {
        this.isCommentToSpeech = state;
        ctx.reply(state ? 'Напиши, что думаешь о докладе' : 'Хорошо')
    }

    setMarkHandler = async (ctx, step) => {
        const mark = ctx.callbackQuery.data.replace(`mark_${step}_`, '');
        this.setMarkToSpeech(ctx, `mark_${step}`, Number(mark));
        if (step === 1) {
            //ctx.editMessageText(ctx.chat.id, ctx.message_id, 'Оцените содержание доклада: ' + mark)
            this.getMarkToSpeechMessage(ctx, 2, mark);
        }
        else {
            //ctx.editMessageText(ctx.chat.id, ctx.message_id, 'Оцените подачу доклада: ' + mark)
            this.sendMessageToSpeechComment(ctx, mark)
        };
    }

    getSpeechInfo = async (ctx) => { //подробнее о докладе
        const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs
        const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;
        let keyboard = [];
        if (!this.isFollowKeybord)
            keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.DETAIL_PROGRAM, COMPONENTS.CALLBACKS.PROGRAM[1]]);
        else keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.DETAIL_FOLLOW, COMPONENTS.CALLBACKS.PROGRAM[1]]);
        let file = 'upload/speaker.jpg';
        if (programs[programIndex - 1]?.speech?.assignments.length > 1) {
            file = `upload/speakers-${programs[programIndex - 1]?.speech?.assignments.map(assignment => assignment.person.id).join('-')}.png`;
            if (!fs.existsSync(file)) {
                file = await createCollage(programs, programIndex);
            }
        } else if (programs[programIndex - 1]?.speech?.assignments.length === 1) {
            if (fs.existsSync(programs[programIndex - 1]?.speech?.assignments[0].person.photo)) {
                file = programs[programIndex - 1]?.speech?.assignments[0].person.photo;
            }
        }

        try {
            const data = await ctx.telegram.sendPhoto(ctx.chat.id, {
                source: fs.createReadStream(file)
            },
                {
                    caption:
                        `${programs[programIndex - 1]?.slot?.name.replace(/\s{2,}/g, ' ').trimEnd()}` +
                        `${programs[programIndex - 1]?.section?.location ? ', ' + programs[programIndex - 1]?.section?.location.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.section?.name ? ', ' + programs[programIndex - 1]?.section?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}\n\n` +
                        `${programs[programIndex - 1]?.speech?.name.replace(/\s{2,}/g, ' ').trimEnd()}\n\n` +
                        `${programs[programIndex - 1]?.speech?.assignments.map(assignment =>
                            (assignment.person.name ? `${assignment.person.name} \n` : '') +
                            (assignment.person?.position ? `${assignment.person?.position}` : '') +
                            (assignment.person?.company?.name ? ` @ ${assignment.person?.company?.name}` : '') + '\n\n'
                        )
                            }`.replace(/\s{2,}/g, ' ').trimEnd() +
                        `${programs[programIndex - 1]?.speech?.abstract ? `${programs[programIndex - 1]?.speech?.abstract.replace(/<(.|\n)*?>/g, '').replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`,
                    parse_mode: 'HTML',
                    ...keyboard
                }
            );
            this.exSpeech = data;
        } catch (e) {
            await ctx.telegram.sendPhoto(ctx.chat.id,
                {
                    source: fs.createReadStream(path)
                },
                {
                    caption:
                        `${programs[programIndex - 1]?.slot?.name.replace(/\s{2,}/g, ' ').trimEnd()}` +
                        `${programs[programIndex - 1]?.section?.location ? ', ' + programs[programIndex - 1]?.section?.location.replace(/\s{2,}/g, ' ').trimEnd() : ''}` +
                        `${programs[programIndex - 1]?.section?.name ? ', ' + programs[programIndex - 1]?.section?.name.replace(/\s{2,}/g, ' ').trimEnd() : ''}\n\n` +
                        `${programs[programIndex - 1]?.speech?.assignments.map(assignment =>
                            (assignment.person.name ? `${assignment.person.name} \n` : '') +
                            (assignment.person?.position ? `${assignment.person?.position}` : '') +
                            (assignment.person?.company?.name ? (`@ ${assignment.person?.company?.name}`) : '') +
                            '\n\n'
                        )
                            }`.replace(/\s{2,}/g, ' ').trimEnd() +
                        `${programs[programIndex - 1]?.speech?.abstract ? `${programs[programIndex - 1]?.speech?.abstract.replace(/<(.|\n)*?>/g, '').replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`,
                },
            );
            const data = await ctx.replyWithHTML(
                `${programs[programIndex - 1]?.speech?.abstract ? `${programs[programIndex - 1]?.speech?.person?.company?.name ? `\n\n` : ``}${programs[programIndex - 1]?.speech?.abstract.replace(/<(.|\n)*?>/g, '').replace(/\s{2,}/g, ' ').trimEnd()}` : ''}`,
                { parse_mode: 'HTML', ...keyboard }
            );
            this.exSpeech = data;
        }


    }

    getSpeechLocation = async (ctx) => { //где проходит доклад
        try {
            const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
            const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex;
            await ctx.replyWithHTML(
                `${programs[programIndex - 1]?.section?.location ? programs[programIndex - 1]?.section?.location : ''}` +
                `${programs[programIndex - 1]?.section?.description ? ', \n\n' + programs[programIndex - 1]?.section?.description.replace(/<(.|\n)*?>/g, '') : ''}`
            );
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    setMarkToSpeech = async (ctx, markName, mark) => {//внести оценку по докладу
        try {
            if (this.isFollowKeybord)
                DBManager.setMarkToSpeech(ctx.update.callback_query.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.speech?.id, markName, mark);
            else
                DBManager.setMarkToSpeech(ctx.update.callback_query.from.id, this.programs[this.programIndex - 1]?.speech?.id, markName, mark);
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getMarkToSpeechMessage = async (ctx, num, mark) => {//Уведомлялка с просьбой поставить оценку
        try {
            const keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.SET_MARKS(num)]);
            switch (num) {
                case 1: {
                    if (this.exSpeech) {
                        if (this.exSpeech?.reply_markup?.inline_keyboard[0]) {
                            const arr = [];
                            this.exSpeech.reply_markup.inline_keyboard[0].forEach((el) => {
                                if (el.callback_data !== 'set_mark') {
                                    arr.push(Markup.button.callback(el.text, el.callback_data));
                                }
                            });
                            this.exSpeech.reply_markup.inline_keyboard[0] = arr;
                            await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exSpeech?.message_id, null, { inline_keyboard: [arr, COMPONENTS.CALLBACKS.PROGRAM[1]] });
                            // this.addQuestionBttn(ctx);
                        }
                    }

                    const data = await ctx.replyWithHTML(
                        `Оцени содержание доклада`,
                        { parse_mode: 'HTML', ...keyboard }
                    );
                    this.exMessage = data;
                    break;
                }
                case 2: {
                    if (this.exMessage) {
                        await ctx.telegram.editMessageText(ctx.chat.id, this.exMessage?.message_id, null, `Оцени содержание доклада: ${mark}`);
                    }
                    const data = await ctx.replyWithHTML(
                        `Оцени подачу доклада`,
                        { parse_mode: 'HTML', ...keyboard }
                    );

                    this.exMessage = data;

                    break;
                }
            }
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }

    }

    getMarkToFollowSpeechMessage = async (ctx, num, mark) => { //оценка для списка избранных докладов
        try {
            const keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.SET_MARKS(num)]);

            switch (num) {
                case 1: {
                    const data = await ctx.replyWithHTML(
                        `Оцени содержание доклада`,
                        { parse_mode: 'HTML', ...keyboard }
                    );
                    this.exMessage = data;
                    break;
                }
                case 2: {
                    if (this.exMessage) {
                        await ctx.telegram.editMessageText(ctx.chat.id, this.exMessage?.message_id, null, `Оцени содержание доклада: ${mark}`);
                    }
                    const data = await ctx.replyWithHTML(
                        `Оцени подачу доклада`,
                        { parse_mode: 'HTML', ...keyboard }
                    );
                    this.exMessage = data;
                    break;
                }
            }
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }

    }

    sendMessageToSpeechComment = async (ctx, mark) => { //комментарий для доклада
        try {
            if (this.exMessage) {
                await ctx.telegram.editMessageText(ctx.chat.id, this.exMessage.message_id, null, `Оцени подачу доклада: ${mark}`);
            }
            const keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.COMMENT]);
            const data = await ctx.replyWithHTML(
                `Хочешь оставить комментарий?`,
                { parse_mode: 'HTML', ...keyboard }
            );
            this.exMessage = data;


        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    addQuestionBttn = async (ctx) => {
        try {
            this.cancelInProgress = true;
            if (this.exSpeech && this.exSpeech?.reply_markup?.inline_keyboard[0]) {
                if (!this.exSpeech?.reply_markup?.inline_keyboard[0].some(item => item.callback_data === COMPONENTS.HEARS.CALLBACKS.QUESTION)) {

                    const keyboardLength = this.exSpeech.reply_markup.inline_keyboard[0].length;
                    const questionIndex = keyboardLength - 1;
                    const arr = this.exSpeech.reply_markup.inline_keyboard[0];
                    arr.splice(questionIndex, 0, COMPONENTS.CALLBACKS.PROGRAM[0][2]);
                    this.exSpeech.reply_markup.inline_keyboard[0] = arr;
                    await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exSpeech?.message_id, null, { inline_keyboard: [arr, COMPONENTS.CALLBACKS.PROGRAM[1]] });
                }
            }

        } catch (e) {
            this.cancelInProgress = false;
            console.log(e);
        }
    }


    sendMessageToSpeechQuestion = async (ctx) => { //уведомлялка с предложением задать вопрос для докладчика
        try {
            const keyboard = Markup.inlineKeyboard([COMPONENTS.CALLBACKS.QUESTION]);
            if (this.exSpeech) {
                if (this.exSpeech?.reply_markup?.inline_keyboard[0]) {
                    const arr = this.exSpeech.reply_markup.inline_keyboard[0].filter((el) => {
                        if (el.callback_data !== 'question')
                            return Markup.button.callback(el.text, el.callback_data);
                    });
                    this.exSpeech.reply_markup.inline_keyboard[0] = arr;
                    await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, this.exSpeech?.message_id, null, { inline_keyboard: [arr, COMPONENTS.CALLBACKS.PROGRAM[1]] });
                }
            }
            const data = await ctx.replyWithHTML(
                `Хочешь задать вопрос спикеру?`,
                { parse_mode: 'HTML', ...keyboard }
            );
            this.exMessage = data;
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    setCommentToSpeech = async (ctx, comment) => { //уведомлялка - ответ, что комментарий принят
        try {
            if (this.isCommentToSpeech) {
                ctx.reply('Хорошо, я передам его спикеру');
                if (!this.isFollowKeybord) {
                    await DBManager.setCommentToSpeech(ctx.update.message.from.id, this.programs[this.programIndex - 1]?.speech?.id, comment);
                } else {
                    await DBManager.setCommentToSpeech(ctx.update.message.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.speech?.id, comment);
                }
            }
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }

    }

    async NodeGoogleSheets(file, sheetId, keyMass, fun) { //подключение гугл таблиц 
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: file,
                scopes: "https://www.googleapis.com/auth/spreadsheets",
            });
            (async () => {
                const client = await auth.getClient();

                const googleSheets = google.sheets({ version: "v4", auth: client });

                const spreadsheetId = sheetId;
                const metaData = await googleSheets.spreadsheets.get({
                    auth,
                    spreadsheetId,
                });
                const data = {
                    auth,
                    spreadsheetId,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                        values: keyMass.change,
                    },
                }
                if (keyMass.append) {
                    data['range'] = keyMass.append;
                    const append = await googleSheets.spreadsheets.values.append(data);
                    fun(append);
                } else if (keyMass.values) {
                    data['range'] = keyMass.values;
                    delete data.valueInputOption; delete data.resource;
                    const values = await googleSheets.spreadsheets.values.get(data);
                    fun(values);
                } else if (keyMass.update) {
                    data['range'] = keyMass.update;
                    const update = await googleSheets.spreadsheets.values.update(data);
                    fun(update);
                }
            })();
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }
    //

    sendQuestionToSpeech = async (ctx, text) => { //отправка вопроса спикеру
        const programs = this.isFollowKeybord ? this.followProgramsBySlot : this.programs;
        const programIndex = this.isFollowKeybord ? this.followProgramIndex : this.programIndex
        ctx.reply('Хорошо, я передам его спикеру');

        const user = ctx.update.message.from;
        try {
            this.NodeGoogleSheets('application/modules/telegram/googleKey.json', process.env.GOOGLE_TABLE_URL, {
                append: programs[programIndex - 1].section.name,
                change: [[programs[programIndex - 1].speech.name, user?.first_name, user?.last_name, text]]
            }, (data) => {
            })

            await DBManager.setQuestionToSpeech(ctx.update.message.from.id, programs[programIndex - 1]?.id, text);
        } catch (e) {
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);

            console.log(e);
        }


        this.isQuestionToSpeech = false;
    }

    getDatesKeybord = async (ctx) => {
        this.currentDate = null;
        const dates = await DBManager.getDates();
        const buttons = [];
        if (dates) {
            let j = 0;
            buttons[j] = [];
            buttons[j].push({ text: '📋 Программа' });
            dates.forEach(async (date, i) => {
                buttons[j].push({ text: date.name });
                if (buttons[j].length == 3) {
                    j++;
                    buttons[j] = [];
                }
                if (i == dates.length - 1)
                    await ctx.reply('Выбери пункт в меню', Markup
                        .keyboard(buttons)
                        .resize()
                    );
            });
        }
    }

    getSlotsKeybord = async (ctx) => { //получить список времени
        try {
            this.slotIndex = -1;
            const events = await DBManager.getEventsByDate(this.currentDate);
            const programs = await DBManager.getProgramsByDate(this.currentDate);
            const slots = [...new Set([...events, ...programs].map(el => {
                if (el.slot?.name) {
                    return el.slot.name
                }

            }))].sort((a, b) => {
                const timeA = a.split(' - ')[0]; // Извлекаем время начала из строки
                const timeB = b.split(' - ')[0];

                // Сравниваем время начала, преобразуя в формат HH:MM
                const timeAParts = timeA.split(':').map(Number);
                const timeBParts = timeB.split(':').map(Number);
                if (timeAParts[0] !== timeBParts[0]) {
                    return timeAParts[0] - timeBParts[0];
                } else {
                    return timeAParts[1] - timeBParts[1];
                }
            });
            const buttons = [];
            if (slots) {
                let j = 0;
                buttons[j] = [];
                buttons[j].push({ text: '📋 Программа' });
                slots.forEach(async (slot, i) => {
                    buttons[j].push({ text: slot });
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
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getSectionsKeybord = async (ctx) => { //получить секции (категории)
        try {
            this.slotIndex = -1;
            const programs = await DBManager.getProgramsByDate(this.currentDate);
            if (programs) {
                const sections = [...new Set([...programs].map(el => {
                    if (el.section?.name) {
                        return el.section?.name
                    }
                }
                ))].filter(name => name !== null)
                    .sort((a, b) => {
                        if (a?.section && b.section) {
                            const aSort = programs.find(program => { if (program.section) { return program.section?.name === a?.section?.sort } });
                            const bSort = programs.find(program => { if (program.section) { return program.section?.name === b?.section?.sort } });
                            return aSort - bSort;
                        }
                    });
                const buttons = [];
                if (sections) {
                    let j = 0;
                    buttons[j] = [];
                    buttons[j].push({ text: '📋 Программа' });
                    sections.forEach(async (section, i) => {
                        buttons[j].push({ text: section });
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
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getProgramsBySectionId = async (ctx, sectionId) => { //Вывод программ по секции
        try {
            this.cancelInProgress = true;
            const programs = await DBManager.getProgramsBySectionId(sectionId, this.currentDate);

            if (programs) {
                this.programs = programs;
                this.programIndex = 0;
                await this.getNextSpeech(ctx, true);
            }
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }

    }

    getFollowProgramsBySlot = async (ctx, slotName) => { //получение избранных докладов по времени
        try {
            this.cancelInProgress = true;
            if (!this.isCommentToSpeech && !this.isQuestionToSpeech) {
                if (this.isFollowKeybord) {
                    this.followProgramIndex = 0;
                    const programs = []
                    if (slotName)
                        this.followSlotName = slotName;
                    this.followPrograms.forEach(schedule => {
                        if (schedule.program.slot.name === this.followSlotName && schedule.program.day.name === this.currentDate)
                            programs.push(schedule.program);
                    })
                    this.followProgramsBySlot = programs;
                    await this.getNextSpeech(ctx);
                } else {
                    await this.getStarterKeybord(ctx);
                }
            }
        } catch (e) {
            console.log(e);
            this.cancelInProgress = false;
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    getFollowSlotsKeybord = async (ctx, telegramId) => { //получение времени избранных докладов
        try {
            this.slotIndex = -1;
            const followPrograms = await DBManager.getFollowPrograms(telegramId);
            if (followPrograms) {

                const allSlots = [];
                followPrograms.forEach(async (schedule, i) => {
                    if (schedule.program.day.name === this.currentDate)
                        allSlots.push(schedule.program.slot.name);
                });

                const uniqueSlots = [...new Set(allSlots)].sort((a, b) => {
                    const timeA = a.split(' - ')[0]; // Извлекаем время начала из строки
                    const timeB = b.split(' - ')[0];

                    // Сравниваем время начала, преобразуя в формат HH:MM
                    const timeAParts = timeA.split(':').map(Number);
                    const timeBParts = timeB.split(':').map(Number);
                    if (timeAParts[0] !== timeBParts[0]) {
                        return timeAParts[0] - timeBParts[0];
                    } else {
                        return timeAParts[1] - timeBParts[1];
                    }
                });;

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
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    emptyFunc() {
        return true
    }

    getConfInfo = async (ctx) => { //получение сообщения о конференции
        this.cancelInProgress = true;
        await ctx.reply(`Добро пожаловать на UIC dev. \n` +
            `Я — бот конференции, @uic_dev_bot. \n\n` +

            `Обязательно подпишись на канал @uicdev — там будут самые свежие анонсы — и вступи в чат @uic_dev — там будет самое горячее общение. \n\n` +

            `Ещё полезные ссылки: https://uic.dev/ — официальный сайт конференции, https://vk.com/uicdev — группа ВК, https://msk24.uic.dev/ — прямая ссылка на программу. \n\n` +

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

    async getNav(ctx) { //получение схемы здания
        this.cancelInProgress = true;
        await ctx.replyWithPhoto({
            source: fs.createReadStream('upload/nav.png')
        });
    }

    followSpeech = async (ctx) => { //добавить доклад в избранное
        try {
            const followSpeech = await DBManager.setFollowSpeech(ctx.update.callback_query.from.id, this.programs[this.programIndex - 1]?.id);
            if (followSpeech)
                ctx.reply(`Ты добавил доклад "${this.programs[this.programIndex - 1]?.speech?.name.replace(/\s{2,}/g, ' ').trimEnd()}" в свое расписание`);
            else ctx.reply(`Доклад "${this.programs[this.programIndex - 1]?.speech?.name.replace(/\s{2,}/g, ' ').trimEnd()}" уже находится в твоем в списке`);
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }

    unfollowSpeech = async (ctx) => { //отписаться от доклада
        try {
            const isRemoved = await DBManager.removeFollowSpeech(ctx.update.callback_query.from.id, this.followProgramsBySlot[this.followProgramIndex - 1]?.id);
            if (isRemoved) {
                ctx.reply(`Доклад был успешно удален`);
                this.getFollowSlotsKeybord(ctx, ctx.update.callback_query.from.id);
            } else ctx.reply(`Похоже, что доклад уже удален`);
        } catch (e) {
            console.log(e);
            await ctx.reply(COMPONENTS.ERRORS.INTERNAL_SERVER);
        }
    }
}

module.exports = MessageManager;