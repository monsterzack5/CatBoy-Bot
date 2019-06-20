/* eslint-disable global-require */
const fs = require('fs');
const cron = require('node-cron');
const request = require('request-promise-native');
const http = require('http');

const spam = require('./lib/tools/antispam');
const fileLoader = require('./lib/tools/fileLoader');
const { bot } = require('./lib/tools/helper');

const port = process.env.PORT || 5010;
let react;
let chan;
let bing;
let db;

// eslint-disable-next-line global-require
if (fs.existsSync('.env')) require('dotenv').config();

// do different things in dev vs prod mode
if (process.env.NODE_ENV === 'dev') {
   // use a different config options for dev mode
   process.env.config_file = process.env.config_file_dev;
   process.env.db_file = process.env.db_file_dev;

   bot.login(process.env.discordtoken_dev);
} else if (process.env.NODE_ENV === 'production') {
   bot.login(process.env.discordtoken);
   // ping our dyno every 15 minutes so heroku doesnt murder it
   setInterval(() => {
      request({
         uri: 'https://catbitchbot.herokuapp.com',
      }).catch(console.error);
   }, 900000);
} else {
   console.error('Error! NODE_ENV not defined! Try running this bot with \'npm run start or npm run dev\'');
   process.exit(1);
}

// create a http server that we can http get from our bot
// so heroku doesnt disable the dyno from no traffic
http.createServer((_req, res) => {
   res.end();
}).listen(port);

bot.on('ready', async () => {
   console.log('Discord Client ready!');

   // this is to load Various files on boot and set runtime vars
   try {
      await fileLoader.importFile(`${process.env.config_file}.json`);
      await fileLoader.importFile(`${process.env.db_file}.db`);
   } catch (error) {
      console.log(`Error! Error importing (mandatory) boot files! \n${error}`);
      process.exit(1);
   }

   // only load this when discord is ready
   const { commands, initDB } = require('./lib/tools/helper');
   initDB();

   react = require('./lib/tools/react');
   chan = require('./lib/tools/4chan');
   bing = require('./lib/tools/bing');
   // eslint-disable-next-line prefer-destructuring
   db = require('./lib/tools/helper').db;

   const config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));
   bot.prefix = config.prefix;
   bot.commands = commands;


   // set the game on boot
   if (config.game_url === '') {
      bot.user.setActivity(config.game, { type: config.game_state });
   } else bot.user.setActivity(config.game, { type: config.game_state, url: config.game_url });

   // only import the command files AFTER discord.js says its ready
   fs.readdir('./lib/', (err, files) => {
      if (err) console.error(err);
      // this line only selects .js files, and adds them to command_files
      const commandFiles = files.filter(f => f.includes('.js'));
      for (const cmd of commandFiles) {
         // eslint-disable-next-line import/no-dynamic-require, global-require
         const props = require(`./lib/${cmd}`);
         try {
            bot.commands.set(props.help.name, props);
         } catch (error) {
            console.log('Error adding commands, file doesnt have name or help properties');
            process.exit(1);
         }
      }
   });
});

bot.on('message', (message) => {
   if (message.author.bot) return;
   if (message.channel.type !== 'text'
      && message.author.id !== process.env.bot_owner) {
      message.react('🤔');
      return;
   }
   const messageArguments = message.content.slice(bot.prefix.length).split(' ');
   const command = messageArguments.shift();
   if (message.content.startsWith(bot.prefix)) {
      const cmdfunction = bot.commands.get(command);
      if (cmdfunction) {
         const isSpam = spam.checkAntiSpam(message, command);
         if (!isSpam) {
            cmdfunction.run(message, messageArguments, command, bot);
         } else {
            message.react('⏲');
         }
      }
   } else if (message.content.substring(1, 7) === 'prefix') {
      message.channel.send(`My prefix is currently ${bot.prefix}!`);
   }
});

// this handle's reactions to our bot's messages
bot.on('raw', async (data) => {
   if (data.t === 'MESSAGE_REACTION_ADD') {
      const msg = await bot.channels.get(data.d.channel_id).fetchMessage(data.d.message_id);
      if (msg.author.id === bot.user.id
         && data.d.emoji.name === '🐱') {
         react.handleReact(data.d.user_id, msg.embeds[0].image.url, bot);
      }
   }
});

// update the 4chan db, then backup the .db, then export the .db, every 5 minutes
cron.schedule('*/5 * * * *', async () => {
   if (!fs.existsSync('./tmp')) {
      fs.mkdirSync('./tmp');
   }

   await chan.update();
   try {
      await db.backup(`./tmp/${process.env.db_file}.db`);
   } catch (e) {
      console.error(`Error! Failed to backup the db!/n${e}`);
   }
   await fileLoader.exportFile(`./tmp/${process.env.db_file}.db`);
});

// updates our bing catboy db once a day at 1pm
cron.schedule('0 13 * * *', () => {
   bing.update();
});
