import { Message } from 'discord.js';
import { exportFile } from '../utils/fileLoader';
import { updateChan } from '../utils/4chan';
import { updateBing } from '../utils/bing';
import { checkHealth } from '../utils/dbhealthcheck';
import { updateBooru } from '../utils/booru';

// TODO: make some functions return values so we can print them out, see: logger
export default (message: Message, args: string[]): void => {
   if (message.author.id !== process.env.botOwner || !args.length) {
      message.react('❌');
      return;
   }

   switch (args[0].toLowerCase()) {
      case 'updateconfig':
         message.channel.send(`Updating ${process.env.configFile} using local version`);
         exportFile(`${process.env.configFile}.json`);
         break;

      case 'updatedb':
         message.channel.send(`Updating ${process.env.dbFile} using local version`);
         exportFile(`${process.env.dbFile}.db`);
         break;


      case 'update4chan':
         message.channel.send('Updating the 4chan imagedb');
         updateChan();
         break;


      case 'updatebing':
         updateBing();
         message.channel.send('Updating the bing db!');
         break;

      case 'updatebooru':
         updateBooru();
         message.channel.send('Updating the booru db!');
         break;

      case 'checkhealth':
         checkHealth();
         message.channel.send('Checking the health of the db!');
         break;

      case 'dump':
         message.channel.send({
            files: [`${process.env.dbFile}.db`],
         });
         break;

      case 'dumpconfig':
         message.channel.send({
            files: [`${process.env.configFile}.json`],
         });
         break;

      default:
         message.channel.send(
            'Unexpected first modifier, should be: [add] or [delete] or [list]',
         );
         break;
   }
};

export const help = {
   name: 'admin',
};
