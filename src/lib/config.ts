import { Message } from 'discord.js';
import { exportFile } from './tools/fileLoader';
import { updateChan } from './tools/4chan';
import { updateBing } from './tools/bing';

export default (message: Message, args: string[]): void => {
   if (message.author.id !== process.env.botOwner || !args.length) {
      message.react('❌');
      return;
   }

   switch (args[0].toLowerCase()) {
      case 'update':
         message.channel.send(`Updating ${process.env.configFile} using local version`);
         exportFile(`${process.env.configFile}.json`);
         break;

      case 'updatedb':
         message.channel.send(`Updating ${process.env.dbFile} using local version`);
         exportFile(`${process.env.dbFile}.db`);
         break;

      case 'dump':
         message.channel.send({
            files: [`${process.env.configFile}.json`],
         });
         break;

      case 'update4chan':
         message.channel.send('Updating 4chan imagedb');
         updateChan();
         break;

      case 'dump4chan':
         message.channel.send({
            files: [`${process.env.dbFile}.db`],
         });
         break;

      case 'updatebing':
         updateBing();
         message.channel.send('Updating bing db!');
         break;

      default:
         message.channel.send(
            'Unexpected first modifier, should be: [add] or [delete] or [list]',
         );
         break;
   }
};

export const help = {
   name: 'config',
};
