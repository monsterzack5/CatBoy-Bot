import { Message } from 'discord.js';
import { db } from '../utils/db';

const selectAlive = db.prepare('SELECT * FROM threads WHERE status = \'alive\'');
const selectArchived = db.prepare('SELECT * FROM threads WHERE status = \'archived\'');

export default (message: Message): void => {
   const aliveThreads = selectAlive.all();
   const archivedThreads = selectArchived.all();
   let reply = '';

   // if there are no threads
   if (!aliveThreads.length && !archivedThreads.length) {
      message.channel.send('It doesnt look like there are any catboy threads right now :thinking:');
      return;
   }

   if (aliveThreads.length) {
      reply += 'Alive threads:';
      for (const thread of aliveThreads) {
         reply += `\nhttps://boards.4channel.org/cm/thread/${thread.postno}`;
      }
   }

   if (archivedThreads.length) {
      reply += '\nArchived Threads:';
      for (const archivedThread of archivedThreads) {
         reply += `\nhttps://boards.4channel.org/cm/thread/${archivedThread.postno}`;
      }
   }

   message.channel.send(`Current thread[s]:\n${reply}`);
};

export const help = {
   name: 'thread',
   timeout: 5000,
   help: 'returns the current 4chan thread(s)',
};
