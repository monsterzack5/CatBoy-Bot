import { readFileSync } from 'fs';
import { Message, TextChannel } from 'discord.js';
import { importFile } from './utils/fileLoader';
import { bot } from './utils/bot';
import { checkRequired } from './utils/required';
import {
   ConfigOptions, RawReactData, Command, DiscordEmbedReply, CommandFunction,
} from './typings/interfaces';

// make sure env vars are set!
if (!checkRequired()) throw new Error('Error! Enviorment Variables not set!');

// functions which will be loaded after discord imports the db
let handleFavorite: (userID: string, url: string) => void;
let handleFilter: (url: string, msg: Message) => void;
let handleReport: (url: string, msg: Message) => void;
let createCommandsMap: () => Promise<Map<string, Command>>;
let createCommandsEmbed: () => DiscordEmbedReply;
let checkAntiSpam: (msgAuthorId: string, command: string) => boolean;
let startTimers: () => void;

// variables to store our command map and help embed
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
} else {
   console.error('Error! NODE_ENV not defined! Try running this bot with \'npm run start or npm run dev\'');
   process.exit(1);
}

// when discord says its ready, we import our db and config, and then load the commands
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

   // import commandhandler.ts, which will import all the files in the commands folder
   // which will export the commandMap and the help embed
   ({ createCommandsMap, createCommandsEmbed } = await import('./utils/commandhandler'));
   commands = await createCommandsMap();
   commandsEmbed = createCommandsEmbed();

   // handlers for reactions
   ({ handleFavorite, handleFilter, handleReport } = await import('./utils/react'));
   // antispam function
   ({ checkAntiSpam } = await import('./utils/antispam'));
   // starts our autoupdate timers
   ({ startTimers } = await import('./timers'));
   startTimers();

   // read the config and set the prefix
   const config: ConfigOptions = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());
   process.env.prefix = config.prefix as string;

   // set the game on boot
   if (config.gameUrl === '') {
      bot.user.setActivity(config.game, { type: config.gameState });
   } else bot.user.setActivity(config.game, { type: config.gameState, url: config.gameUrl });
});

// function to handle any message that anyone sends
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
      const cmdfunction: CommandFunction = commands.get(command) as Command;
      if (cmdfunction) {
         const isSpam = checkAntiSpam(message.author.id, command);
         if (!isSpam) {
            cmdfunction(message, messageArguments);
         } else {
            message.react('⏲');
         }
      } else if (command === 'help') {
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
