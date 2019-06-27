import { Message } from 'discord.js';
import { bot } from './tools/bot';

export default (message: Message, args: string[]): void => {
   if (message.guild.member(bot.user).hasPermission('MANAGE_MESSAGES')) {
      if (args.length === 0) {
         message.react('❌');
         return;
      }
      message.channel.send(args.join(' '));
      message.delete();
      return;
   }
   message.react('❌');
};

export const help = {
   name: 'sayd',
   help: 'echos a message, then deletes the original message',
};
