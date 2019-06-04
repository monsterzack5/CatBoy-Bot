'use strict';

let fs = require('fs');
const fileLoader = require('./tools/fileLoader');

module.exports.run = async (message, args, command, bot) => {
  let config = JSON.parse(fs.readFileSync('./config_cat.json'));
  if (args.length > 0) {
    config.prefix = args[0];
    bot.prefix = args[0];
    message.channel.send('Prefix changed!');
    fs.writeFileSync('./config_cat.json', JSON.stringify(config, null, 2));
    fileLoader.exportFile(bot, 'config_cat.json');
  } else message.channel.send('Prefix can\'t be blank!');
}

module.exports.help = {
  name: 'prefix',
  help: 'used to change my prefix to whatever, !prefix always works if you forget the current prefix'
}