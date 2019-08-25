import { Message } from 'discord.js';
import { db } from '../utils/db';

const selectAlive = db.prepare('SELECT * FROM threads WHERE status = \'alive\'');
const selectArchived = db.prepare('SELECT * FROM threads WHERE status = \'archived\'');

export default (message: Message): void => {
   let reply = '';
   const aliveThreads = selectAlive.all();
   const archivedThreads = selectArchived.all();
   console.log(JSON.stringify(archivedThreads, null, 2));

   // if there are no threads
   if (!aliveThreads.length && !archivedThreads.length) {
      message.channel.send('It doesnt look like there are any catboy threads right now :thinking:');
      return;
   }

   if (aliveThreads.length) {
      reply += 'Alive threads:'
      for (const thread of aliveThreads) {
         reply += `\nhttps://boards.4channel.org/cm/thread/${thread.no}`;
      }
   }

   if (archivedThreads.length) {
      reply += '\nArchived Threads:'
      for (const archivedThread of archivedThreads) {
         reply += `\nhttps://boards.4channel.org/cm/thread/${archivedThread.no}`;
      }
   }

   message.channel.send(`Current thread[s]:\n${reply}`);
};

export const help = {
   name: 'thread',
   // help: 'returns the current 4chan thread(s)',
};
