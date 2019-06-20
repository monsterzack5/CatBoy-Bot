const { db } = require('./tools/helper');

const search = db.prepare('SELECT * FROM threads');

module.exports.run = async (message) => {
   let reply = '';
   const threads = search.all();

   // if there are no threads
   if (!threads) return message.channel.send('It doesnt look like there are any catboy threads right now :thinking:');

   for (const thread of threads) {
      reply += `\nhttps://boards.4channel.org/cm/thread/${thread.no}`;
   }
   return message.channel.send(`Current thread[s]: ${reply}`);
};

module.exports.help = {
   name: 'thread',
   help: 'returns the current 4chan thread(s)',
};
