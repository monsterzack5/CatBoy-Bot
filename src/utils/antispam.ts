import { LookUpTable } from '../typings/interfaces';
import { createTimeOutTable } from './commandhandler';
import { memDb } from './db';
// Variables
const lookUpTable: LookUpTable = createTimeOutTable();

// Sqlite calls
const getLastCommand = memDb.prepare('SELECT time FROM antispam WHERE uid = ? AND command = ?');
const insertNewCommand = memDb.prepare('INSERT INTO antispam (uid, command, time) VALUES (?, ?, ?)');
const updateLastCommand = memDb.prepare('UPDATE antispam SET time = ? WHERE uid = ? AND command = ?');

/**
 * This function is only ever meant to get messages which the bot will do
 * something with.
 */
export function checkAntiSpam(msgAuthorId: string, command: string): boolean {
   const lastTimeCalled = getLastCommand.get(msgAuthorId, command);

   // if nothing is returned, we should ALWAYS add to the queue
   if (!lastTimeCalled) {
      insertNewCommand.run(msgAuthorId, command, Date.now());
      return false;
   }

   // if the message time is less than the allowed time
   // then the message isn't spam.
   if (lastTimeCalled.time < (Date.now() - lookUpTable[command] || 1000)) {
      updateLastCommand.run(Date.now(), msgAuthorId, command);
      return false;
   }
   // we return true because the message is spam
   return true;
}
