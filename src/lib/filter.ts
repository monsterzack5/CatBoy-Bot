import { Message } from 'discord.js';
import {
   insertFilter,
   searchBingById,
   searchChanByNo,
   deleteChanByNo,
   deleteBingById,
} from './tools/db';

export default async (message: Message, args: string[]): Promise<void> => {
   if (message.author.id !== process.env.botOwner) {
      message.react('❌');
      return;
   }
   if (args.length < 2) {
      const msg = await message.channel.send('Err: not enough args') as Message;
      msg.delete(3000);
      return;
   }
   switch (args[0].toLowerCase()) {
      case 'bing': {
         if (args[1].length !== 40) {
            const msg = await message.channel.send('Err: bad id format for bing') as Message;
            msg.delete(3000);
            return;
         }
         const exists = searchBingById.get(args[1]);
         if (exists) {
            insertFilter.run(args[1], 'bing');
            deleteBingById.run(args[1]);
            message.react('✅');
            return;
         }
         message.react('⁉');
         break;
      }

      case 'chan': {
         if (args[1].length !== 13) {
            const msg = await message.channel.send('Err: bad id format for chan') as Message;
            msg.delete(3000);
            return;
         }
         const exists = searchChanByNo.get(args[1]);
         if (exists) {
            insertFilter.run(args[1], 'chan');
            deleteChanByNo.run(args[1]);
            message.react('✅');
            return;
         }
         message.react('⁉');
         break;
      }

      default: {
         const msg = await message.channel.send('Err: bad source') as Message;
         msg.delete(3000);
         break;
      }
   }
};

export const help = {
   name: 'filter',
};
