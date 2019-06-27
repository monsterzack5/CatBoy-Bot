// import cron from 'node-cron';
import {
   readFileSync, readdir, existsSync,
   mkdirSync,
} from 'fs';
import request from 'request-promise-native';
import http from 'http';
import { Message, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';

import { checkAntiSpam } from './lib/tools/antispam';
import { importFile, exportFile } from './lib/tools/fileLoader';
import { bot } from './lib/tools/bot';
import { checkRequired } from './lib/tools/required';
import { db } from './lib/tools/db';

if (!checkRequired()) throw new Error('Error! Enviorment Variables not set!');

const port = process.env.PORT || 5010;
let handleReact: (userID: string, url: string) => void;
let updateChan: () => void;
// let updateBing: () => void;

const commands = new Map();
let prefix: string;

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

   // only load everything else
   db.initDb();

   ({ handleReact } = await import('./lib/tools/react'));
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
      const test = await Promise.all(cmdPromises);
      try {
         for (const cmd of test) {
            commands.set(cmd.help.name, cmd.default);
         }
      } catch (error) {
         console.log('Error adding commands, file doesnt have name or help properties');
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
         const isSpam = checkAntiSpam(message, command);
         if (!isSpam) {
            cmdfunction(message, messageArguments);
         } else {
            message.react('⏲');
         }
      }
   } else if (message.content.substring(1, 7) === 'prefix') {
      message.channel.send(`My prefix is currently ${prefix}`);
   }
});

// this handle's reactions to our bot's messages
bot.on('raw', async (data: RawReactData): Promise<void> => {
   if (data.t === 'MESSAGE_REACTION_ADD') {
      const reactChannel = await bot.channels.get(data.d.channel_id) as TextChannel;
      if (!reactChannel) {
         return;
      }
      const msg = await reactChannel.fetchMessage(data.d.message_id);
      if (msg.author.id === bot.user.id
         && data.d.emoji.name === '🐱') {
         handleReact(data.d.user_id, msg.embeds[0].image.url);
      }
   }
});

// update the 4chan db, then backup the .db, then export the .db, every 5 minutes
schedule('*/5 * * * *', async (): Promise<void> => {
   if (!existsSync('./tmp')) {
      mkdirSync('./tmp');
   }
   await updateChan();
   try {
      await db.get().backup(`./tmp/${process.env.dbFile}.db`);
   } catch (e) {
      console.error(`Error! Failed to backup the db!/n${e}`);
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
   help: HelpProps;
}

interface HelpProps {
   name: string;
   help: string;
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
