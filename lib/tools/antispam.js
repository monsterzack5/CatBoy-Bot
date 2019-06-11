/**
 * The idea, and theory behind this antispam function is based off of:
 * https://github.com/Michael-J-Scofield/discord-anti-spam/
 *
 * But the code used is entirely my own, written by me.
 * As the original npm module is programmed differently from my needs.
 *
 * TODO:
 * const exempt = ['Role', 'Names', 'Here'];
 * add a limiter so the global queue doesn't overflow
 */

// Constants
const timeLimit = 1500;

// Containers
let messages = [];

function pushToMessages(message, command) {
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
async function checkAntiSpam(message, command) {
   const oldMessage = messages.find(msg => msg.auth === message.author.id
      && msg.cmd === command);

   // if no messages are found, eg: they have never used the command
   // we should ALWAYS add to the queue
   if (!oldMessage) {
      pushToMessages(message, command);
      return Promise.resolve(false);
   }

   // if the message time is less than the allowed time
   // then the message isn't spam.
   if (oldMessage.time < (Date.now() - timeLimit)) {
      const temp = messages.filter(msg => msg.auth !== message.author.id
         && msg.cmd !== command);
      messages = temp;
      pushToMessages(message, command);
      return Promise.resolve(false);
   }

   // we return true because the message is spam
   return Promise.resolve(true);
}


module.exports = {
   checkAntiSpam,
};
