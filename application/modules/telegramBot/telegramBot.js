
const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');

const UserManager = require('../user/UserManager');
const MessageHandler = require('../../handlers/MessageHandler');
const DBManager = require('../db/DBManager');

const bot = new Telegraf(process.env.BOT_TOKEN);

/* Сообщение с кнопками */
/************************** */
bot.start(MessageHandler.getStarterMessage);


//MESSAGE FROM MENU
bot.hears('📋 Программа', MessageHandler.getProgramKeybord);
bot.hears('🔥 Идет сейчас', (ctx) => MessageHandler.getProgramsList(ctx, true));
bot.hears('➡️ Следующий слот', async (ctx) => MessageHandler.getProgramsList(ctx, false))
bot.hears('↩️ Главное меню', MessageHandler.getStarterKeybord);
bot.hears('👤 Участникам', MessageHandler.getConfInfo);
bot.hears('🗺️ Схема', MessageHandler.getNav);
bot.hears('🕓 Вся программа по слотам', MessageHandler.getSlotsKeybord);
bot.hears('🗃️ Вся программа по секциям', MessageHandler.getSectionsKeybord);
bot.hears('❤️ Мое расписание', (ctx) => MessageHandler.getFollowSlotsKeybord(ctx, ctx.update.message.from.id));

//END MESSAGE FROM MENU

bot.on(message('text'), async (ctx) => {
    const slots = await DBManager.getSlots();
    const sections = await DBManager.getSections();

    switch (ctx.update.message.text) {
        case '/program': MessageHandler.getProgramKeybord(ctx); break;
        case '/now': MessageHandler.getProgramsList(ctx, true); break;
        case '/next': MessageHandler.getProgramsList(ctx, false); break;
        case '/my': MessageHandler.getFollowSlotsKeybord(ctx, ctx.update.message.from.id); break;
        case '/nav': MessageHandler.getNav(ctx); break;
        case '/faq': MessageHandler.getConfInfo(ctx); break;
    }

    if (MessageHandler.isFollowKeybord && !MessageHandler.isQuestionToSpeech && !MessageHandler.isCommentToSpeech) {
        MessageHandler.getFollowProgramsBySlot(ctx, ctx.update.message.text)
    }
    if (MessageHandler.isCommentToSpeech) {
        MessageHandler.setCommentToSpeech(ctx, ctx.update.message.text)
        MessageHandler.isCommentToSpeech = false;
    } if (MessageHandler.isQuestionToSpeech) {
        MessageHandler.sendQuestionToSpeech(ctx, ctx.update.message.text)
    } if (slots && !MessageHandler.isFollowKeybord) {
        slots.forEach(slot => {
            if (slot.name == ctx.update.message.text) {
                MessageHandler.getProgramsList(ctx, true, slot.time_start)
            }
        });
    } if (sections) {
        sections.forEach(section => {
            if (section.name == ctx.update.message.text) {
                MessageHandler.getProgramsBySectionId(ctx, section.id)
            }
        });
    }
});

//CALLBACKS FROM MESSAGE BUTTONS
bot.action('programIndex', async (ctx) => {
    try {
        ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await MessageHandler.getNextSpeech(ctx);
    } catch (e) {
        await MessageHandler.getNextSpeech(ctx);
    }
});

bot.action('speech_info', async (ctx) => {
    try {
        ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await MessageHandler.getSpeechInfo(ctx);
    } catch (e) {
        await MessageHandler.getSpeechInfo(ctx);
    }

});

bot.action('follow', async (ctx) => await MessageHandler.followSpeech(ctx));
bot.action('unfollow', async (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await MessageHandler.unfollowSpeech(ctx)
})

bot.action('set_mark', async (ctx) => await MessageHandler.getMarkToSpeechMessage(ctx, 1));

bot.action('follow_set_mark', async (ctx) => await MessageHandler.getMarkToFollowSpeechMessage(ctx, 1))

//END CALLBACKS FROM MESSAGE BUTTONS


//SOMETHING ELSE
bot.command('quit', async (ctx) => {
    await ctx.telegram.leaveChat(ctx.message.chat.id);
    await ctx.leaveChat();
});

bot.on('callback_query', async (ctx) => {
    if (!MessageHandler.isFollowKeybord && ctx.callbackQuery.data.indexOf('mark_1') >= 0) {
        MessageHandler.setMarkToSpeech(ctx, 'mark_1', Number(ctx.callbackQuery.data.replace('mark_1_', '')));
        MessageHandler.getMarkToSpeechMessage(ctx, 2);
    } else if (!MessageHandler.isFollowKeybord && ctx.callbackQuery.data.indexOf('mark_2') >= 0) {
        MessageHandler.setMarkToSpeech(ctx, 'mark_2', Number(ctx.callbackQuery.data.replace('mark_2_', '')));
        MessageHandler.sendMessageToSpeechComment(ctx);
    } else if (ctx.callbackQuery.data == 'speechComment_yes') {
        MessageHandler.isCommentToSpeech = true;
        ctx.reply('Напиши, что думаешь о докладе')
    } else if (ctx.callbackQuery.data == 'speechComment_no') {
        MessageHandler.isCommentToSpeech = false;
        ctx.reply('Хорошо')
    }
    else if (MessageHandler.isFollowKeybord && ctx.callbackQuery.data.indexOf('mark_1') >= 0) { //Для докладов из Мое расписание
        MessageHandler.setMarkToSpeech(ctx, 'mark_1', Number(ctx.callbackQuery.data.replace('mark_1_', '')));
        MessageHandler.getMarkToFollowSpeechMessage(ctx, 2);
    } else if (MessageHandler.isFollowKeybord && ctx.callbackQuery.data.indexOf('mark_2') >= 0) {
        MessageHandler.setMarkToSpeech(ctx, 'mark_2', Number(ctx.callbackQuery.data.replace('mark_2_', '')));
        MessageHandler.sendMessageToSpeechComment(ctx);
    }
    //Конец для докладов из Мое расписание
    else if (ctx.callbackQuery.data == 'question') {
        MessageHandler.sendMessageToSpeechQuestion(ctx);
    } else if (ctx.callbackQuery.data == 'speechQuestion_yes') {
        MessageHandler.isQuestionToSpeech = true;
        ctx.reply('Напиши, что хочешь спросить')
    } else if (ctx.callbackQuery.data == 'speechQuestion_no') {
        MessageHandler.isQuestionToSpeech = false;
        ctx.reply('Хорошо')
    }
    await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)
    //await ctx.answerCbQuery()
})

bot.on('inline_query', async (ctx) => {
    const result = []
    await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)
    await ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
//END SOMETHING ELSE

module.exports = bot;