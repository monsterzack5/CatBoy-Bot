import { Message } from 'discord.js';
import { bot } from '../utils/bot';

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
   help: 'Who said that? :smirk_cat:',
   timeout: 1250,
};
