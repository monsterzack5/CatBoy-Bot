import { Message } from 'discord.js';

export default (message: Message, args: string[]): void => {
   if (args.length) {
      message.channel.send(args.join(' '));
      return;
   }
   message.react('❌');
};

export const help = {
   name: 'say',
   help: 'Repeat after me :smile_cat:',
   timeout: 1250,
};
