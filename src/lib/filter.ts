const { db } = require('./tools/helper');

const insertFilter = db.prepare('INSERT INTO filtered VALUES (?, ?)');

const searchBing = db.prepare('SELECT * FROM bingcats WHERE id = ?');
const searchChan = db.prepare('SELECT * FROM chancats WHERE no = ?');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE id = ?');

module.exports.run = async (message, args) => {
   if (message.author.id !== process.env.bot_owner) {
      message.react('❌');
      return;
   }
   if (args.length < 2) {
      message.channel.send('Err: not enough args').then(msg => msg.delete(3000));
      return;
   }
   switch (args[0].toLowerCase()) {
      case 'bing': {
         if (args[1].length !== 40) {
            message.channel.send('Err: bad id format for bing').then(msg => msg.delete(3000));
            return;
         }
         const exists = searchBing.get(args[1]);
         if (exists) {
            insertFilter.run(args[1], 'bing');
            deleteBing.run(args[1]);
            message.react('✅');
            return;
         }
         message.react('⁉');
         break;
      }

      case 'chan': {
         if (args[1].length !== 13) {
            message.channel.send('Err: bad id format for chan').then(msg => msg.delete(3000));
            return;
         }
         const exists = searchChan.get(args[1]);
         if (exists) {
            insertFilter.run(args[1], 'chan');
            deleteChan.run(args[1]);
            message.react('✅');
            return;
         }
         message.react('⁉');
         break;
      }

      default: {
         message.channel.send('Err: bad source').then(msg => msg.delete(3000));
         break;
      }
   }
};

module.exports.help = {
   name: 'filter',
   help: 'adsfasdfasdfasdf',
};
