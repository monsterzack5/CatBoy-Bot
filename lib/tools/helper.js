/**
 * this is a helper function mean to import our discord client and db
 */
const Discord = require('discord.js');
const Sqlite = require('better-sqlite3');

module.exports.bot = new Discord.Client();
module.exports.commands = new Discord.Collection();
module.exports.db = new Sqlite('./cats.db', { verbose: console.log });
