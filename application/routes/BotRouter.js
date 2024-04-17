
const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');


const UserManager = require('../modules/user/UserManager');
const MessageManager = require('../modules/telegram/MessageManager');
const DBManager = require('../modules/db/DBManager');
const COMPONENTS = require('../components/telegramComponents');
const users = {};
const bot = new Telegraf(process.env.BOT_TOKEN);

async function checkUser(chat_id, chat, ctx) {
    if (!users[chat_id])
        users[chat_id] = new MessageManager();
    if (chat) {
        chat.telegram_id = `${chat_id}`;
        try {
            const data = await UserManager.auth(chat);
        } catch (e) {
            console.log(e);
        }
    }
}

async function callFunction(user, ctx, cancelState, func) {
    try {
        user.cancelInProgress = true;
        user.cancelMessage(ctx, cancelState).then(() => {
            if (func)
                func().then(() => {
                    user.cancelInProgress = false;
                })
            else user.cancelInProgress = false;
        })
    } catch (e) {
        console.log(e);
        user.cancelInProgress = false;
    }

}

/* Сообщение с кнопками */
/************************** */
bot.start(async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    if (!users[chat_id])
        users[chat_id] = new MessageManager();
    await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getStarterMessage(ctx));
});


//MESSAGE FROM MENU
bot.hears(COMPONENTS.HEARS.TITLES.PROGRAM, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramKeybord(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.NOW, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsList(ctx, true));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.NEXT_SLOT, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsList(ctx, false));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.MAIN, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getStarterKeybord(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.FOR_USERS, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getConfInfo(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.SCHEME, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getNav(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.PROGRAMS_BY_SLOT, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getSlotsKeybord(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});
bot.hears(COMPONENTS.HEARS.TITLES.PROGRAMS_BY_SECTIONS, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getSectionsKeybord(ctx));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);

});
bot.hears(COMPONENTS.HEARS.TITLES.MY_SCHEDULE, async (ctx) => {
    const chat_id = ctx.update.message.chat.id;
    checkUser(chat_id, ctx.update.message.chat);
    if (!users[chat_id].cancelInProgress)
        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getFollowSlotsKeybord(ctx, chat_id));
    else ctx.reply(COMPONENTS.ERRORS.SPAM);
});

//END MESSAGE FROM MENU

bot.on(message('text'), async (ctx) => {
    try {
        const slots = await DBManager.getSlots();
        const sections = await DBManager.getSections();
        const chat_id = ctx?.update?.message?.chat?.id;
        checkUser(chat_id, ctx.update.message.chat);
        if (!users[chat_id].cancelInProgress) {
            switch (ctx.update.message.text) {
                case '/program': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramKeybord(ctx)); break;
                case '/now': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsList(ctx, true)); break;
                case '/next': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsList(ctx, false)); break;
                case '/my': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getFollowSlotsKeybord(ctx, chat_id)); break;;
                case '/nav': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getNav(ctx)); break;
                case '/faq': await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getConfInfo(ctx)); break;
            }


            if (slots && !users[chat_id].isFollowKeybord) { //получаем программу по выбранному слоту
                for (let slot of slots) {
                    if (slot.name == ctx.update.message.text) {
                        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsList(ctx, true, slot.time_start, slot.time_end));
                    }
                };
            }
            if (sections) {
                for (let section of sections) { //получаем программу по выбранной
                    if (section.name == ctx.update.message.text) {
                        await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getProgramsBySectionId(ctx, section.id));
                    }
                };
            }

            if (users[chat_id].isCommentToSpeech) {
                users[chat_id].setCommentToSpeech(ctx, ctx.update.message.text)
                users[chat_id].isCommentToSpeech = false;
            } else if (users[chat_id].isQuestionToSpeech) {
                users[chat_id].sendQuestionToSpeech(ctx, ctx.update.message.text);
                users[chat_id].isQuestionToSpeech = false;
            } else if (users[chat_id].isFollowKeybord) {
                await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getFollowProgramsBySlot(ctx, ctx.update.message.text));
            }
        } else {
            ctx.reply(COMPONENTS.ERRORS.SPAM);
        }
    } catch (e) {
        console.log(e);
    }
});

//END CALLBACKS FROM MESSAGE BUTTONS

//SOMETHING ELSE
bot.command('quit', async (ctx) => {
    await ctx.telegram.leaveChat(ctx.message.chat.id);
    await ctx.leaveChat();
});

bot.on('callback_query', async (ctx) => {
    try {
        const chat_id = ctx.update.callback_query.from.id
        checkUser(chat_id);
        if (!users[chat_id].cancelInProgress) {
            if (ctx.callbackQuery.data == COMPONENTS.HEARS.CALLBACKS.SET_MARK) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].getMarkToSpeechMessage(ctx, 1))
            }
            else if (ctx.callbackQuery.data.indexOf('mark_1') >= 0) {
                await callFunction(users[chat_id], ctx, null, () => users[chat_id].setMarkHandler(ctx, 1));
            }
            else if (ctx.callbackQuery.data.indexOf('mark_2') >= 0) {
                await callFunction(users[chat_id], ctx, null, () => users[chat_id].setMarkHandler(ctx, 2));
            }
            else if (ctx.callbackQuery.data == COMPONENTS.HEARS.CALLBACKS.DETAIL) {
                await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getSpeechInfo(ctx));
            }
            else if (ctx.callbackQuery.data == COMPONENTS.HEARS.CALLBACKS.NEXT_PROGRAM) {
                await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].getNextSpeech(ctx));
            }
            else if (ctx.callbackQuery.data == COMPONENTS.HEARS.CALLBACKS.FOLLOW) {
                await callFunction(users[chat_id], ctx, null, () => users[chat_id].followSpeech(ctx));
            }
            else if (ctx.callbackQuery.data == COMPONENTS.HEARS.CALLBACKS.UNFOLLOW) {
                await callFunction(users[chat_id], ctx, 'all', () => users[chat_id].unfollowSpeech(ctx));
            }
            else if (ctx.callbackQuery.data === COMPONENTS.HEARS.CALLBACKS.QUESTION) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].sendMessageToSpeechQuestion(ctx));
            }
            else if (ctx.callbackQuery.data === COMPONENTS.HEARS.CALLBACKS.SPEECH_QUESTION_YES) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].switchStateAskQuestion(ctx, true));
            }
            else if (ctx.callbackQuery.data === COMPONENTS.HEARS.CALLBACKS.SPEECH_QUESTION_NO) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].switchStateAskQuestion(ctx, false));
            }
            else if (ctx.callbackQuery.data === COMPONENTS.HEARS.CALLBACKS.SPEECH_COMMENT_YES) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].switchStateComment(ctx, true));
            }
            else if (ctx.callbackQuery.data === COMPONENTS.HEARS.CALLBACKS.SPEECH_COMMENT_NO) {
                await callFunction(users[chat_id], ctx, 'message', () => users[chat_id].switchStateComment(ctx, false));
            } else {
                await callFunction(users[chat_id], ctx, null, null);
            }
        }
        else ctx.reply(COMPONENTS.ERRORS.SPAM);
    } catch (e) {
        console.log(e);
    }
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