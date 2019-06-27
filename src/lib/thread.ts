import { Message } from 'discord.js';
import { db } from './tools/db';

const search = db.get().prepare('SELECT * FROM threads');

export default (message: Message): void => {
   let reply = '';
   const threads = search.all();

   // if there are no threads
   if (!threads) {
      message.channel.send('It doesnt look like there are any catboy threads right now :thinking:');
      return;
   }

   for (const thread of threads) {
      reply += `\nhttps://boards.4channel.org/cm/thread/${thread.no}`;
   }
   message.channel.send(`Current thread[s]: ${reply}`);
};

export const help = {
   name: 'thread',
   help: 'returns the current 4chan thread(s)',
};
