'use strict';

let fs = require('fs');
const fileLoader = require('./tools/fileLoader');

module.exports.run = async (message, args, command, bot) => {
  let config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));
  if (args.length > 0) {
    config.prefix = args[0];
    bot.prefix = args[0];
    message.channel.send('Prefix changed!');
    fs.writeFileSync(`./${process.env.config_file}.json`, JSON.stringify(config, null, 2));
    fileLoader.exportFile(bot, `${process.env.config_file}.json`);
  } else message.channel.send('Prefix can\'t be blank!');
}

module.exports.help = {
  name: 'prefix',
  help: 'used to change my prefix to whatever, !prefix always works if you forget the current prefix'
}