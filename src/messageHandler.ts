import { Message, TextChannel } from 'discord.js';
import { bot } from './utils/bot';
import { checkAntiSpam } from './utils/antispam';
import { startTimers } from './utils/timers';
import { getBotActions, handleBotAction } from './utils/botActions';
import { handleFavorite, handleFilter, handleReport } from './utils/handleReactions';
import { createCommandsMap, createHelpEmbed } from './utils/commandhandler';
import { RawReactData, BotActions } from './typings/interfaces';

const commands = createCommandsMap();
const commandsEmbed = createHelpEmbed();
let botActions: BotActions = getBotActions();

// start the timers
startTimers();

// function to handle any message that anyone sends
bot.on('message', (message: Message): void => {
   if (message.author.bot) return;
   if (message.channel.type !== 'text'
      && message.author.id !== process.env.botOwner) {
      message.react('🤔');
      return;
   }
   if (message.content.startsWith(process.env.prefix)) {
      const messageArguments = message.content.slice((process.env.prefix).length).split(' ');
      const command = messageArguments.shift() as string;
      const commandFunc = commands.get(command);
      if (commandFunc) {
         if (!checkAntiSpam(message.author.id, command)) {
            commandFunc(message, messageArguments);
            return;
         }
         message.react('⏲');
         return;
      }
      const action = botActions.get(command);
      if (action) {
         if (!checkAntiSpam(message.author.id, command)) {
            handleBotAction(message, command, action);
            return;
         }
         message.react('⏲');
         return;
      }
      if (command === 'help') {
         message.react('📬');
         message.author.send(commandsEmbed);
      }
   } else if (message.content.substring(1, 7) === 'prefix') {
      message.channel.send(`My prefix is currently ${process.env.prefix}`);
   }
});

// this handle's reactions to our bot's messages
bot.on('raw', async (data: RawReactData): Promise<void> => {
   if (data.t === 'MESSAGE_REACTION_ADD') {
      const reactChannel = bot.channels.get(data.d.channel_id) as TextChannel;
      if (!reactChannel) {
         // this means we dont have permission to read the channel history
         return;
      }
      // get the message that received the reaction
      const msg = await reactChannel.fetchMessage(data.d.message_id);
      if (msg.author.id === bot.user.id) {
         if (data.d.emoji.name === '🐱') {
            handleFavorite(data.d.user_id, msg.embeds[0].image.url);
         } else if (data.d.emoji.name === '😾'
            && data.d.user_id !== bot.user.id) {
            handleReport(msg.embeds[0].image.url, msg);
         } else if (data.d.emoji.name === '🇫'
            && data.d.user_id !== bot.user.id) {
            handleFilter(msg.embeds[0].image.url, msg, data.d.user_id);
         }
      }
   }
});

bot.on('updateBotActions', () => {
   botActions = getBotActions();
});
