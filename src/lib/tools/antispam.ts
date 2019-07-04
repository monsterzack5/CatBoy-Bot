import { readdirSync } from 'fs';
import { StoredMessage, LookUpTable, Command } from '../../typings/interfaces';

/**
 * The idea behind this antispam function is based off of:
 * https://github.com/Michael-J-Scofield/discord-anti-spam/
 *
 * But the code used is entirely my own, written by me.
 * As the original npm module is programmed differently from my needs.
 *
 * TODO:
 * const exempt = ['Role', 'Names', 'Here'];
 */


// Variables
let messages: StoredMessage[] = [];
const lookUpTable: LookUpTable = {};
const defaultTimeLimit = 1000;


// this anon function will import every file in /lib/
// and make a lookup table of each command's time limit
// we wrap it in () so we don't polute the namespace
(async function init(): Promise<void> {
   const filepromises: Promise<Command>[] = [];
   const files = readdirSync('./dist/lib/')
      .filter(f => f.endsWith('.js'));
   for (const file of files) {
      filepromises.push(import(`../${file}`));
   }
   const cmdFiles = await Promise.all(filepromises);
   for (const cmd of cmdFiles) {
      if (!cmd.help.timeout) cmd.help.timeout = defaultTimeLimit;
      lookUpTable[cmd.help.name] = cmd.help.timeout;
   }
}());
function pushToMessages(msgAuthorId: string, command: string): void {
   messages.push({
      time: Date.now(),
      auth: msgAuthorId,
      cmd: command,
   });
}

/**
 * This function is only ever meant to get messages which the bot will do
 * something with.
 */
export function checkAntiSpam(msgAuthorId: string, command: string): boolean {
   const oldMessage = messages.find(msg => msg.auth === msgAuthorId
      && msg.cmd === command);

   // if no messages are found, eg: they have never used the command
   // we should ALWAYS add to the queue
   if (!oldMessage) {
      pushToMessages(msgAuthorId, command);
      return false;
   }

   // if the message time is less than the allowed time
   // then the message isn't spam.
   if (oldMessage.time < (Date.now() - lookUpTable[command])) {
      messages = messages.filter(msg => msg.auth !== msgAuthorId
         && msg.cmd !== command);
      pushToMessages(msgAuthorId, command);
      console.log(`message is NOT, timelimit: ${lookUpTable[command]}`);
      return false;
   }
   console.log(`message is spam, timelimit: ${lookUpTable[command]}`);
   // we return true because the message is spam
   return true;
}
