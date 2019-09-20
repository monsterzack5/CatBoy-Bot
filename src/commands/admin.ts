import { Message } from 'discord.js';
import { exportFile } from '../utils/fileLoader';
import { updateChan } from '../utils/4chan';
import { updateBing } from '../utils/bing';
import { checkHealth } from '../utils/dbhealthcheck';
import { updateBooru } from '../utils/booru';
import { db } from '../utils/db';
import { reloadActions } from '../index';

const listActions = db.prepare('SELECT DISTINCT action from botactions');
const selectAction = db.prepare('SELECT url FROM botactions WHERE url = ?');
const insertAction = db.prepare('INSERT INTO botactions (url, action) VALUES (?, ?)');
const deleteAction = db.prepare('DELETE FROM botactions WHERE url = ?');

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

      case 'addaction':
         if (args[2]) {
            const doesUrlExist = selectAction.get(args[2]);
            if (doesUrlExist) {
               message.channel.send('Err! An action with the given url already exists!');
               return;
            }
            console.log(`addaction: trying to add action ${args[1]} with url ${args[2]}`);
            insertAction.run(args[2], args[1].toLowerCase());
            reloadActions();
            message.channel.send(`Added action: \`${args[1]}\` with url: \`${args[2]}\``);
         } else {
            message.channel.send('Err! Incorrect format, correct format is addaction <action> <url>');
         }
         break;

      case 'deleteaction':
         if (args[1] && args.length) {
            console.log(`deleteaction: trying to delete action from url \`${args[2]}\``);
            const didDelete = deleteAction.run(args[1]);
            if (didDelete.changes) {
               message.channel.send(`Deleted url: \`${args[1]}\` from actions table`);
            } else {
               message.channel.send('Err! DB Reported no changes made. (Did you enter the url correctly?)');
            }
         } else {
            message.channel.send('Err! incorrect format, correct format is deleteaction <url>');
         }
         break;

      case 'listactions':
         message.channel.send(`All possible actions are:${listActions.all().reduce((acc, key) => `${acc}\n${key.action}`, '')}`);
         break;

      default:
         message.channel.send('Unknown admin command, did you forget them already?');
         break;
   }
};

export const help = {
   name: 'admin',
};
