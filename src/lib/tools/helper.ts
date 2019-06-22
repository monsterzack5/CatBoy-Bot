const Discord = require('discord.js');
const Sqlite = require('better-sqlite3');

// we need to wait till after the discord client is ready, because
// we need the discord client to download our db.
module.exports.initDB = function initDB() {
   console.log('db has been loaded!');
   module.exports.db = new Sqlite(`${process.env.db_file}.db`, { verbose: console.log });
};

module.exports.bot = new Discord.Client();
module.exports.commands = new Discord.Collection();

process.on('SIGINT', async () => {
   // for some strange reason, having fileLoader in the global scope
   // makes this return an error saying exportfile isnt defined
   const fileLoader = require('./fileLoader'); // eslint-disable-line global-require

   this.db.close();
   await fileLoader.exportFile(`${process.env.db_file}.db`);
   console.log('aught interrupt signal, exiting!');
   process.exit(0);
});

// only archive the db on sigterm
process.on('SIGTERM', async () => {
   const fileLoader = require('./fileLoader'); // eslint-disable-line global-require
   
   this.db.close();
   await fileLoader.exportFile(`${process.env.db_file}.db`);
   await fileLoader.exportFile(`${process.env.db_file}.db`, 'archive');
   console.log('Goodbye!');
   // heroku doesnt want to play nice
   // process.exit(0);
});
