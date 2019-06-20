const fs = require('fs');
const fileLoader = require('./tools/fileLoader');
const { bot } = require('./tools/helper');

module.exports.run = async (message, args) => {
   if (message.author.id !== process.env.bot_owner) {
      message.react('❌');
      return;
   }
   const config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));
   if (args.length > 0) {
      [config.prefix] = args;
      [bot.prefix] = args;
      console.log(`bot.prefix: ${bot.prefix}`);
      message.channel.send('Prefix changed!');
      fs.writeFileSync(`./${process.env.config_file}.json`, JSON.stringify(config, null, 2));
      fileLoader.exportFile(`${process.env.config_file}.json`);
   } else message.channel.send('Prefix can\'t be blank!');
};

module.exports.help = {
   name: 'prefix',
   help: 'used to change my prefix to whatever, !prefix always works if you forget the current prefix',
};
