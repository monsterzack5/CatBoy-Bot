import {
   readFileSync, existsSync,
   mkdirSync,
} from 'fs';
import request from 'request-promise-native';
import http from 'http';
import { Message, TextChannel } from 'discord.js';
import { Database } from 'better-sqlite3';
import { schedule } from 'node-cron';

import { importFile, exportFile } from './utils/fileLoader';
import { bot } from './utils/bot';
import { checkRequired } from './utils/required';
import {
   ConfigOptions, RawReactData, Command, DiscordEmbedReply,
} from './typings/interfaces';

if (!checkRequired()) throw new Error('Error! Enviorment Variables not set!');

const port = process.env.PORT || 5010;
// functions which will be loaded after discord imports the db
let handleFavorite: (userID: string, url: string) => void;
let handleFilter: (url: string, msg: Message) => void;
let handleReport: (url: string, msg: Message) => void;
let updateChan: () => void;
let createCommandsMap: () => Promise<Map<string, Command>>;
let createCommandsEmbed: () => DiscordEmbedReply;
let checkAntiSpam: (msgAuthorId: string, command: string) => boolean;
let db: Database;
// let updateBing: () => void;

let commands: Map<string, Command>;
let commandsEmbed: DiscordEmbedReply = {};

// do different things in dev vs prod mode
if (process.env.NODE_ENV === 'dev') {
   // use a different config options for dev mode
   process.env.configFile = process.env.configFileDev;
   process.env.dbFile = process.env.dbFileDev;

   bot.login(process.env.discordTokenDev);
} else if (process.env.NODE_ENV === 'production') {
   bot.login(process.env.discordToken);
   // ping our dyno every 15 minutes so heroku doesnt murder it
   setInterval((): void => {
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
http.createServer((_req, res): void => {
   res.end();
}).listen(port);

bot.on('ready', async (): Promise<void> => {
   console.log('Discord Client ready!');

   // this is to load Various files on boot and set runtime vars
   try {
      await importFile(`${process.env.configFile}.json`);
      await importFile(`${process.env.dbFile}.db`);
   } catch (error) {
      console.error(new Error('Error! Error importing (mandatory) boot files!'));
      process.exit(1);
   }

   ({ db } = await import('./utils/db'));

   ({ createCommandsMap, createCommandsEmbed } = await import('./utils/commandhandler'));
   commands = await createCommandsMap();
   commandsEmbed = createCommandsEmbed();

   ({ handleFavorite, handleFilter, handleReport } = await import('./utils/react'));
   ({ updateChan } = await import('./utils/4chan'));
   ({ checkAntiSpam } = await import('./utils/antispam'));
   // ({ updateBing } = await import('./lib/tools/bing'));

   const config: ConfigOptions = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());
   process.env.prefix = config.prefix;
   process.env.prefix = process.env.prefix as string;

   // set the game on boot
   if (config.gameUrl === '') {
      bot.user.setActivity(config.game, { type: config.gameState });
   } else bot.user.setActivity(config.game, { type: config.gameState, url: config.gameUrl });
});

bot.on('message', (message: Message): void => {
   if (message.author.bot) return;
   if (message.channel.type !== 'text'
      && message.author.id !== process.env.botOwner) {
      message.react('🤔');
      return;
   }
   if (message.content.startsWith(process.env.prefix as string)) {
      const messageArguments = message.content.slice((process.env.prefix as string).length).split(' ');
      const command = messageArguments.shift() as string;
      const cmdfunction: (message: Message, args: string[]) => void | Promise<void> = commands.get(command) as Command;
      if (cmdfunction) {
         const isSpam = checkAntiSpam(message.author.id, command);
         if (!isSpam) {
            cmdfunction(message, messageArguments);
         } else {
            message.react('⏲');
         }
      } else if (command === 'help') {
         // we should dm them
         message.react('📬');
         message.author.send(commandsEmbed);
      }
   } else if (message.content.substring(1, 7) === 'prefix') {
      message.channel.send(`My prefix is currently ${process.env.prefix}`);
   }
});

// this handle's reactions to our bot's messages
bot.on('raw', async (data: RawReactData): Promise<void> => {
   if (data.t === 'MESSAGE_REACTION_ADD') {
      const reactChannel = await bot.channels.get(data.d.channel_id) as TextChannel;
      if (!reactChannel) {
         // this means we dont have permission to read the channel history
         return;
      }
      // get the message that received the reaction
      const msg = await reactChannel.fetchMessage(data.d.message_id);
      if (msg.author.id === bot.user.id) {
         if (data.d.emoji.name === '🐱') {
            handleFavorite(data.d.user_id, msg.embeds[0].image.url);
         } else if (data.d.emoji.name === '😾'
            && data.d.user_id !== bot.user.id) {
            handleReport(msg.embeds[0].image.url, msg);
         } else if (data.d.user_id === process.env.botOwner
            && data.d.emoji.name === '🇫') {
            handleFilter(msg.embeds[0].image.url, msg);
         }
      }
   }
});

// update the 4chan db, then backup the .db, then export the .db, every 5 minutes
schedule('*/5 * * * *', async (): Promise<void> => {
   if (!existsSync('./tmp/')) {
      mkdirSync('./tmp/');
   }
   await updateChan();
   try {
      await db.backup(`./tmp/${process.env.dbFile}.db`);
   } catch (e) {
      console.error(`Error! Failed to backup the db!\n${e} `);
   }
   await exportFile(`./tmp/${process.env.dbFile}.db`);
});

// updates our bing catboy db once a day at 1pm
// disabled until further notice
// schedule('0 13 * * *', (): void => {
//    updateBing();
// });
