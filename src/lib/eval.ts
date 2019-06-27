import { Message } from 'discord.js';

import { inspect } from 'util';

export default (message: Message, args: string[]): void => {
   if (message.author.id !== process.env.botOwner) {
      message.react('❌');
      return;
   }
   try {
      const code = args.join(' ');
      // eslint-disable-next-line no-eval
      let evaled = eval(code);
      if (typeof evaled !== 'string') {
         evaled = inspect(evaled);
      }
      message.channel.send(evaled);
   } catch (err) {
      message.channel.send(`Error! ${err}`);
   }
};

export const help = {
   name: 'eval',
   help: 'you can\'t use this',
};
