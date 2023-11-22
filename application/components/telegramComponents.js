const { Markup } = require("telegraf");
const DBManager = require("../modules/db/DBManager");

const TELEGRAM_COMPONENTS = {
    //MENU
    programKeybord: [
        [{ text: '🔥 Идет сейчас' }, { text: '➡️ Следующий слот' }], // Row1 with 2 buttons
        [{ text: '🗃️ Вся программа по секциям' }], // Row2 with 2 buttons
        [{ text: '🕓 Вся программа по слотам' }],
        [{ text: '↩️ Главное меню' }],
        // ['button 5', 'button 6', 'button 7'] // Row3 with 3 buttons
    ],
    starterKeybord: [
        [{ text: '📋 Программа' }, { text: '❤️ Мое расписание' }], // Row1 with 2 buttons
        [{ text: '🗺️ Схема' }, { text: '👤 Участникам' }], // Row2 with 2 buttons
    ],
    // speechInfoKeybord: [
    //     [{ text: '📋 Программа' }, { text: '🗺️ Где проходит' }],
    // ],
    // followSpeechInfoKeybord: [
    //     [{ text: '❤️ Мое расписание' }, { text: '🗺️ Где проходит' }],
    // ],
    slotsKeybord: [
        async () => {

        }
    ],
    //END MENU

    //MESSAGE BUTTONS
    programButtonsFrstRow: [
        Markup.button.callback('⋮', `speech_info`), //this.programs[this.programIndex].id
        Markup.button.callback('👍', `set_mark`),
        Markup.button.callback('❔', `question`),
        Markup.button.callback('❤️', `follow`),
    ],
    speechInfoButtonsFrstRow: [
        Markup.button.callback('👍', `set_mark`),
        Markup.button.callback('❔', `question`),
        Markup.button.callback('❤️', `follow`),
    ],
    programButtonsScndRow: [
        Markup.button.callback('Показать еще', `programIndex`)
    ],
    speechButtons: [
        Markup.button.callback('👍', `set_mark`),
        Markup.button.callback('❔', `question`),
        Markup.button.callback('❤️', `follow`),
    ],
    followSpeechButtons: [
        Markup.button.callback('⋮', `speech_info`),
        Markup.button.callback('👍', `set_mark`),
        Markup.button.callback('❔', `question`),
        Markup.button.callback('💔', `unfollow`),
    ],
    followSpeechInfoFrstRow: [
        Markup.button.callback('👍', `set_mark`),
        Markup.button.callback('❔', `question`),
        Markup.button.callback('💔', `unfollow`),
    ],
    marksButtons: (num) => [
        Markup.button.callback('1', `mark_${num}_1`),
        Markup.button.callback('2', `mark_${num}_2`),
        Markup.button.callback('3', `mark_${num}_3`),
        Markup.button.callback('4', `mark_${num}_4`),
        Markup.button.callback('5', `mark_${num}_5`),
    ],
    speechCommentButtons: [
        Markup.button.callback('Да', `speechComment_yes`),
        Markup.button.callback('Нет', `speechComment_no`),
    ],
    speechQuestionButtons: [
        Markup.button.callback('Да', `speechQuestion_yes`),
        Markup.button.callback('Нет', `speechQuestion_no`),
    ]
    //END MESSAGE BUTTONS
}

module.exports = TELEGRAM_COMPONENTS;