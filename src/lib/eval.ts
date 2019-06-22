const util = require('util');

module.exports.run = async (message, args) => {
   if (message.author.id !== process.env.bot_owner) {
      message.react('❌');
      return;
   }
   try {
      const code = args.join(' ');
      // eslint-disable-next-line no-eval
      let evaled = eval(code);
      if (typeof evaled !== 'string') {
         evaled = util.inspect(evaled);
      }
      message.channel.send(evaled);
   } catch (err) {
      message.channel.send(`Error! ${err}`);
   }
};

module.exports.help = {
   name: 'eval',
   help: 'you can\'t use this',
};
