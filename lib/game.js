/* eslint-disable prefer-destructuring */
const fs = require('fs');
const fileLoader = require('./tools/fileLoader');

const gameStates = ['playing', 'watching', 'listening', 'streaming'];

function updateConfig(bot, config) {
   if (config.game_url === '') {
      bot.user.setActivity(config.game, { type: config.game_state });
   } else bot.user.setActivity(config.game, { type: config.game_state, url: config.game_url });
   fs.writeFileSync(`./${process.env.config_file}.json`, JSON.stringify(config, null, 2));
   fileLoader.exportFile(bot, `${process.env.config_file}.json`);
}

module.exports.run = async (message, args, command, bot) => {
   const config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));

   if (message.author.id !== process.env.bot_owner) return;

   // if the command is just `!game`, we remove the game
   if (!args.length) {
      config.game = '';
      config.game_state = '';
      config.game_url = '';
      updateConfig(bot, config);
      message.channel.send('Removed game!');
      console.log('changed game status');
      return;
   }

   if (gameStates.includes(args[0].toLowerCase())) {
      // set the state
      config.game_state = args.shift();
      // if twitch.tv was the second arg
      if (args[0].match(/twitch.tv/)) {
         // checks for if the url was in the correct format
         if (args[0].match(/^twitch?(.tv)?\/?/)) {
            // streaming stuff
            config.game_url = `http://${args.shift()}`;
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
      config.game_state = 'playing';
      config.game = args.join(' ');
   }
   updateConfig(bot, config);
   message.channel.send(`Updated to ${config.game_state.toLowerCase()} ${config.game}`);
   console.log('changed game status');
};


module.exports.help = {
   name: 'game',
   help: '(game) or [listening] (audio) or [watching] (video) or [streaming] (twitch.url/url) (flavor text)',
};
