import { Message } from 'discord.js';

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

// Constants
const timeLimit = 1500;

// Containers
let messages: StoredMessage[] = [];

function pushToMessages(message: Message, command: string): void {
   messages.push({
      time: Date.now(),
      auth: message.author.id,
      cmd: command,
   });
}

/**
 * This function is only ever meant to get messages which the bot will do
 * something with.
 */
export function checkAntiSpam(message: Message, command: string): boolean {
   const oldMessage = messages.find(msg => msg.auth === message.author.id
      && msg.cmd === command);

   // if no messages are found, eg: they have never used the command
   // we should ALWAYS add to the queue
   if (!oldMessage) {
      pushToMessages(message, command);
      return false;
   }

   // if the message time is less than the allowed time
   // then the message isn't spam.
   if (oldMessage.time < (Date.now() - timeLimit)) {
      const temp = messages.filter(msg => msg.auth !== message.author.id
         && msg.cmd !== command);
      messages = temp;
      pushToMessages(message, command);
      return false;
   }

   // we return true because the message is spam
   return true;
}

interface StoredMessage {
   time: number;
   auth: string;
   cmd: string;
}
