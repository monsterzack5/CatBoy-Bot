const fs = require('fs');

let db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));

// watch for any changes to the db, update if a change occurs
fs.watch(`./${process.env.db_file}.json`, () => {
   if (process.uptime() > 5) {
      setTimeout(() => {
         db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`, 'utf8'));
      }, 2000);
   }
});

module.exports.run = async (message) => {
   let reply = '';
   for (const thread of db.goodThreads) {
      reply += `\nhttps://boards.4channel.org/cm/thread/${thread}`;
   }
   return message.channel.send(`Current thread[s]: ${reply}`);
};

module.exports.help = {
   name: 'thread',
   help: 'returns the current 4chan thread(s)',
};
