import { Message } from 'discord.js';
import { exportFile } from '../utils/fileLoader';
import { updateChan } from '../utils/4chan';
import { updateBing } from '../utils/bing';
import { checkHealth } from '../utils/dbhealthcheck';
import { updateBooru } from '../utils/booru';
import { db } from '../utils/db';
import { reloadActions } from '../index';
import { checkAdmin } from '../utils/checkAdmin';
import { logger } from '../utils/logger';

// SQlite calls for botActions
const listActions = db.prepare('SELECT DISTINCT action from botactions');
const selectAction = db.prepare('SELECT url FROM botactions WHERE url = ?');
const insertAction = db.prepare('INSERT INTO botactions (url, action) VALUES (?, ?)');
const deleteAction = db.prepare('DELETE FROM botactions WHERE url = ?');

// Sqlite calls for adding admins
const selectAdmin = db.prepare('SELECT * FROM admins WHERE uid = ?');
const insertAdmin = db.prepare('INSERT INTO admins (uid) VALUES (?)');
const deleteAdmin = db.prepare('DELETE FROM admins WHERE uid = ?');

// TODO: make some functions return values so we can print them out, see: logger
export default (message: Message, args: string[]): void => {
   if (!checkAdmin(message.author.id)) {
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
            insertAction.run(args[2], args[1].toLowerCase());
            reloadActions();
            message.channel.send(`Added action: \`${args[1]}\` with url: \`${args[2]}\``);
            logger.log(`addaction::admin: action: ${args[1]} added with url \`${args[2]}\``);
         } else {
            message.channel.send('Err! Incorrect format, correct format is addaction <action> <url>');
         }
         break;

      case 'deleteaction':
         if (args[1] && args.length) {
            const didDelete = deleteAction.run(args[1]);
            if (didDelete.changes) {
               message.channel.send(`Deleted url: \`${args[1]}\` from actions table`);
               logger.log(`deleteaction::admin: deleted url: \`${args[1]}\``);
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

      case 'addadmin':
         if (message.author.id !== process.env.botOwner) {
            message.react('❌');
            logger.warn(`addadmin::admin: Existing Admin: ${message.author.id} tried to add an admin with uid: ${args[1]}`);
            return;
         }
         if (args[1].length < 17) {
            message.channel.send('Err! Incorrect userid provided!');
         } else {
            const alreadyAdmin = selectAdmin.get(args[1]);
            if (alreadyAdmin) {
               message.channel.send('Err! userid provided is already an admin!');
            } else {
               insertAdmin.run(args[1]);
               message.channel.send('Admin successfully added!');
               logger.log(`addadmin::admin: Added Admin with uid ${args[1]}`);
            }
         }
         break;

      case 'deleteadmin':
         if (message.author.id !== process.env.botOwner) {
            message.react('❌');
            logger.warn(`deleteadmin::admin: Existing Admin: ${message.author.id} tried to delete the admin with uid: ${args[1]}`);
            return;
         }
         if (args[1].length < 17) {
            message.channel.send('Err! Incorrect userid provided!');
         } else {
            const isDeleted = deleteAdmin.run(args[1]);
            if (isDeleted.changes) {
               message.channel.send('Admin deleted successfully!');
               logger.log(`deleteadmin::admin: Deleted Admin with uid ${args[1]}`);
            } else {
               message.channel.send('Err! db reported no changes, do you have the correct userid?');
            }
         }
         break;

      default:
         message.channel.send('Unknown admin command, did you forget them already?');
         break;
   }
};

export const help = {
   name: 'admin',
};
