import {
   readFileSync, readdir, existsSync,
   mkdirSync,
} from 'fs';
import request from 'request-promise-native';
import http from 'http';
import { Message, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';
import { Database } from 'better-sqlite3';

import { checkAntiSpam } from './lib/tools/antispam';
import { importFile, exportFile } from './lib/tools/fileLoader';
import { bot } from './lib/tools/bot';
import { checkRequired } from './lib/tools/required';

if (!checkRequired()) throw new Error('Error! Enviorment Variables not set!');

const port = process.env.PORT || 5010;
let handleFavorite: (userID: string, url: string) => void;
let handleFilter: (url: string, msg: Message) => void;
let handleReport: (url: string, msg: Message) => void;
let updateChan: () => void;
let db: Database;
// let updateBing: () => void;

const commands = new Map();
let commandsEmbed: Embed = {};

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

   ({ db } = await import('./lib/tools/db'));
   ({ handleFavorite, handleFilter, handleReport } = await import('./lib/tools/react'));
   ({ updateChan } = await import('./lib/tools/4chan'));
   // ({ updateBing } = await import('./lib/tools/bing'));

   const config: ConfigOptions = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());
   process.env.prefix = config.prefix;
   process.env.prefix = process.env.prefix as string;

   // set the game on boot
   if (config.gameUrl === '') {
      bot.user.setActivity(config.game, { type: config.gameState });
   } else bot.user.setActivity(config.game, { type: config.gameState, url: config.gameUrl });

   // only import the command files AFTER discord.js says its ready
   readdir('./dist/lib/', async (err, files): Promise<void> => {
      if (err) console.error(err);
      // this line only selects .js files, and adds them to command_files
      const commandFiles = files.filter(f => f.endsWith('.js'));
      const cmdPromises: Promise<Command>[] = [];
      for (const cmdFile of commandFiles) {
         const importedCmd: Promise<Command> = import(`./lib/${cmdFile}`);
         cmdPromises.push(importedCmd);
      }
      // wait for all the promises from import() to resolve
      const commandFunctions = await Promise.all(cmdPromises);
      const commandDesc: string[] = [];
      try {
         // add the command name as a key and function as a value to a map
         for (const cmd of commandFunctions) {
            commands.set(cmd.help.name, cmd.default);

            // make the !help embed
            if (cmd.help.help) {
               commandDesc.push(`**${process.env.prefix}${cmd.help.name}**: ${cmd.help.help}\n`);
            }
         }
         commandDesc.push('\nsee any BAD catboys? report them by reacting with :pouting_cat:!');
         const randomColor = await import('randomcolor');
         const color = parseInt((randomColor.default() as string).substring(1), 16);
         commandsEmbed = {
            embed: {
               color,
               title: 'Catboy Commands! uwu',
               description: commandDesc.join(' '),
            },
         };
      } catch (error) {
         console.error('Error importing commands, malformed command file');
         process.exit(1);
      }
   });
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
      const cmdfunction: (message: Message, args: string[]) => void | Promise<void> = commands.get(command);
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

interface Command {
   default(message: Message, args: string[]): void;
   help: {
      name: string;
      help: string;
   };
}

interface ConfigOptions {
   prefix: string;
   gameUrl: string;
   game: string;
   gameState: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | undefined;
}

interface RawReactData {
   t: string;
   s: number;
   op: number;
   d: {
      user_id: string;
      message_id: string;
      guild_id: string;
      channel_id: string;
      emoji: {
         name: string;
         id: string | null;
         animated: boolean;
      };
   };
}

interface Embed {
   embed?: {
      title: string;
      description: string;
      color: number;
   };
}
