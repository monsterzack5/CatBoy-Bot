import { Message } from 'discord.js';
import { writeFileSync, readFileSync } from 'fs';
import { exportFile } from '../utils/fileLoader';
import { bot } from '../utils/bot';
import { ConfigOptions } from '../typings/interfaces';
import { checkAdmin } from '../utils/checkAdmin';
import { logger } from '../utils/logger';

const gameStates = ['playing', 'watching', 'listening', 'streaming'];

function updateConfig(config: ConfigOptions): void {
   if (config.gameUrl === '') {
      bot.user.setActivity(config.game, { type: config.gameState });
   } else bot.user.setActivity(config.game, { type: config.gameState, url: config.gameUrl });
   logger.log(`Updating Game to: ${config.game} Game State: ${config.gameState} Twitch Url: ${config.gameUrl}`);
   writeFileSync(`./${process.env.configFile}.json`, JSON.stringify(config, null, 2));
   exportFile(`${process.env.configFile}.json`);
}

export default (message: Message, args: string[]): void => {
   if (!checkAdmin(message.author.id)) {
      message.react('❌');
      return;
   }

   const config: ConfigOptions = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());

   // if the command is just `!game`, we remove the game
   if (!args.length) {
      delete config.game;
      delete config.gameState;
      delete config.gameUrl;
      updateConfig(config);
      message.channel.send('Removed game!');
      console.log('changed game status');
      return;
   }

   if (gameStates.includes(args[0].toLowerCase())) {
      // set the state
      config.gameState = args.shift() as ConfigOptions['gameState'];
      // if twitch.tv was the second arg
      if (args[0].match(/twitch.tv/)) {
         // checks for if the url was in the correct format
         if (args[0].match(/^twitch?(.tv)?\/?/)) {
            // streaming stuff
            config.gameUrl = `http://${args.shift()}`;
            config.game = args.join(' ');
         } else {
            // warn for incorrect format
            message.channel.send('Invaild url! Should be in the format: twitch.tv/channel!');
            return;
         }
      } else {
         // we're here if we're not a streaming url, so watching, listening, playing
         config.game = args.join(' ');
      }
   } else {
      // this is for the command format `!game hello world`
      config.gameState = 'PLAYING';
      config.game = args.join(' ');
   }
   updateConfig(config);
   const state = config.gameState as string;
   message.channel.send(`Updated to ${state.toLowerCase()} ${config.game}`);
   console.log('changed game status');
};


export const help = {
   name: 'game',
};
