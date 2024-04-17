const { Markup } = require("telegraf");

const TITLES = {
    PROGRAM: '📋 Программа',
    NOW: '🔥 Идет сейчас',
    NEXT_SLOT: '➡️ Следующий слот',
    MAIN: '↩️ Главное меню',
    FOR_USERS: '👤 Участникам',
    SCHEME: '🗺️ Схема',
    PROGRAMS_BY_SLOT: '🕓 Вся программа по слотам',
    PROGRAMS_BY_SECTIONS: '🗃️ Вся программа по секциям',
    MY_SCHEDULE: '❤️ Мое расписание',
    DETAIL: '⋮',
    SET_MARK: '👍',
    QUESTION: '❔',
    FOLLOW: '❤️',
    UNFOLLOW: '💔',
    NEXT_PROGRAM: 'Показать еще',
    YES: 'Да',
    NO: 'НЕТ'
}

const CALLBACKS_DATA = {
    DETAIL: `speech_info`,
    SET_MARK: `set_mark`,
    QUESTION: `question`,
    FOLLOW: `follow`,
    UNFOLLOW: `unfollow`,
    NEXT_PROGRAM: `next_program`,
    SPEECH_COMMENT_YES: `speechComment_yes`,
    SPEECH_COMMENT_NO: `speechComment_no`,
    SPEECH_QUESTION_YES: `speechQuestion_yes`,
    SPEECH_QUESTION_NO: `speechQuestion_no`
}

const COMPONENTS = {
    //MENU
    PROGRAM_KEYBOARD: [
        [{ text: TITLES.NOW }, { text: TITLES.NEXT_SLOT }], // Row1 with 2 buttons
        [{ text: TITLES.PROGRAMS_BY_SECTIONS }], // Row2 with 2 buttons
        [{ text: TITLES.PROGRAMS_BY_SLOT }],
        [{ text: TITLES.MAIN }],
        // ['button 5', 'button 6', 'button 7'] // Row3 with 3 buttons
    ],
    STARTER_KEYBOARD: [
        [{ text: TITLES.PROGRAM }, { text: TITLES.MY_SCHEDULE }], // Row1 with 2 buttons
        [{ text: TITLES.SCHEME }, { text: TITLES.FOR_USERS }], // Row2 with 2 buttons
    ],
    CALLBACKS: {
        PROGRAM: [
            [
                Markup.button.callback(TITLES.DETAIL, CALLBACKS_DATA.DETAIL), //this.programs[this.programIndex].id
                Markup.button.callback(TITLES.SET_MARK, CALLBACKS_DATA.SET_MARK),
                Markup.button.callback(TITLES.QUESTION, CALLBACKS_DATA.QUESTION),
                Markup.button.callback(TITLES.FOLLOW, CALLBACKS_DATA.FOLLOW),
            ],
            [
                Markup.button.callback(TITLES.NEXT_PROGRAM, CALLBACKS_DATA.NEXT_PROGRAM)
            ]
        ],
        DETAIL_PROGRAM: [
            Markup.button.callback(TITLES.SET_MARK, CALLBACKS_DATA.SET_MARK),
            Markup.button.callback(TITLES.QUESTION, CALLBACKS_DATA.QUESTION),
            Markup.button.callback(TITLES.FOLLOW, CALLBACKS_DATA.FOLLOW),
        ],
        FOLLOW: [
            Markup.button.callback(TITLES.DETAIL, CALLBACKS_DATA.DETAIL),
            Markup.button.callback(TITLES.SET_MARK, CALLBACKS_DATA.SET_MARK),
            Markup.button.callback(TITLES.QUESTION, CALLBACKS_DATA.QUESTION),
            Markup.button.callback(TITLES.UNFOLLOW, CALLBACKS_DATA.UNFOLLOW),
        ],
        DETAIL_FOLLOW: [
            Markup.button.callback(TITLES.SET_MARK, CALLBACKS_DATA.SET_MARK),
            Markup.button.callback(TITLES.QUESTION, CALLBACKS_DATA.QUESTION),
            Markup.button.callback(TITLES.UNFOLLOW, CALLBACKS_DATA.UNFOLLOW),
        ],
        SET_MARKS: (num) => [
            Markup.button.callback('1', `mark_${num}_1`),
            Markup.button.callback('2', `mark_${num}_2`),
            Markup.button.callback('3', `mark_${num}_3`),
            Markup.button.callback('4', `mark_${num}_4`),
            Markup.button.callback('5', `mark_${num}_5`),
        ],
        COMMENT: [
            Markup.button.callback(TITLES.YES, CALLBACKS_DATA.SPEECH_COMMENT_YES),
            Markup.button.callback(TITLES.NO, CALLBACKS_DATA.SPEECH_COMMENT_NO),
        ],
        QUESTION: [
            Markup.button.callback(TITLES.YES, CALLBACKS_DATA.SPEECH_QUESTION_YES),
            Markup.button.callback(TITLES.NO, CALLBACKS_DATA.SPEECH_QUESTION_NO),
        ],
    },
    HEARS: {
        TITLES: { ...TITLES },
        CALLBACKS: { ...CALLBACKS_DATA }
    },
    ERRORS: {
        INTERNAL_SERVER: 'Ошибка обработки сообщения',
        SPAM: 'Дождитесь ответа на прошлый запрос'
    }
    //END MESSAGE BUTTONS
}

module.exports = COMPONENTS;