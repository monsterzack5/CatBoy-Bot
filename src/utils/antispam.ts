import { StoredMessage, LookUpTable } from '../typings/interfaces';
import { createTimeOutTable } from './commandhandler';

// Variables
let messages: StoredMessage[] = [];
const lookUpTable: LookUpTable = createTimeOutTable();

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
      return false;
   }
   // we return true because the message is spam
   return true;
}
