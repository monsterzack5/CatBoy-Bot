/* eslint-disable indent */
const fileLoader = require('./tools/fileLoader');
const chan = require('./tools/4chan');
const bing = require('./tools/bing');

module.exports.run = async (message, args) => {
   // this checks if the given command was just: `-config`
   if (message.author.id !== process.env.bot_owner) return message.react('❌');
   if (!args.length) return message.react('❌');

   switch (args[0].toLowerCase()) {
      case 'update':
         message.channel.send(`Updating ${process.env.config_file} using local version`);
         return fileLoader.exportFile(`${process.env.config_file}.json`);

      case 'updatedb':
         message.channel.send(`Updating ${process.env.db_file} using local version`);
         return fileLoader.exportFile(`${process.env.db_file}.db`);

      case 'dump':
         return message.channel.send({
            files: [`${process.env.config_file}.json`],
         });

      case 'update4chan':
         message.channel.send('Updating 4chan imagedb');
         return chan.update();

      case 'dump4chan':
         return message.channel.send({
            files: [`${process.env.db_file}.db`],
         });

      case 'updatebing':
         bing.update();
         return message.channel.send('Updating bing db!');

      default:
         return message.channel.send(
            'Unexpected first modifier, should be: [add] or [delete] or [list]',
         );
   }
};

module.exports.help = {
   name: 'config',
   help: '[update] or [update4chan] or [dumb] or [dumb4chan]',
};
