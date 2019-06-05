'use strict';
let fs = require('fs');
let fileLoader = require('./tools/fileLoader');

module.exports.run = async (message, args, command, bot) => {

  let config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));

  if (message.author.id !== config.bot_owner) return;

  if (args.length > 0) {
    switch (args[0].toLowerCase()) {

      case 'watching':
        config.game_state = 'WATCHING';
        args.shift()
        config.game = args.join(' ');
        break;

      case 'listening':
        config.game_state = 'LISTENING';
        args.shift();
        config.game = args.join(' ');
        break;

      case 'streaming':
        if (args.length > 1);
        // This part checks for a vaild URL, must be in
        // in the format twitch.tv/username
        let result = args[1].match('^twitch?(\.tv)?\/?');
        if (!result) {
          message.channel.send('Invaild url! Should be in the format: twitch.tv/channel!')
            .then(msg => msg.delete(3000));
          message.delete();
          return;
        }
        config.game_state = 'STREAMING';
        config.game_url = 'http://' + args[1];
        args.splice(0, 2);
        config.game = args.join(' ');
        break;

      default:
        config.game = args.join(' ');
        config.game_state = 'PLAYING';
        break;
    }
    // this runs everytime the switch statement runs
    // this updates the game with all known info.
    updateActivity(config.game, config.game_url, config.game_state, bot, message, config);

    // this line is called if you call the command
    // with nothing after it, fully removing the Activity.
  } else {
    config.game = '';
    config.game_state = '';
    config.game_url = '';
    updateActivity(config.game, config.game_url, config.game_state, bot, message, config);
  }
}

function updateActivity(game, url, type, bot, message, config) {
  // this seems like a bad way of doing this
  // but its the easist way, so eh
  if (config.game_state == 'PLAYING') {
    bot.user.setActivity(config.game)
      .catch(console.error);
  } else if (config.game_state == 'WATCHING') {
    bot.user.setActivity(config.game, {
        type: config.game_state
      })
      .catch(console.error);
  } else {
    bot.user.setActivity(config.game, {
        type: config.game_state,
        url: config.game_url
      })
      .catch(console.error);
  }

  if (game == '' && url == '' && type == '') {
    message.channel.send(`Removed game!`);
    bot.user.setActivity(null);
    return;
  }


  fs.writeFileSync(`./${process.env.config_file}.json`, JSON.stringify(config, null, 2));
  fileLoader.exportFile(bot, `${process.env.config_file}.json`);

  message.channel.send(`Updated to ${config.game_state.toLowerCase()} ${config.game}`)
  console.log('changed game status');
}


module.exports.help = {
  name: 'game',
  help: '(game) or [listening] (audio) or [watching] (video) or [streaming] (twitch_url) (flavor text)'
}