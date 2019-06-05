'use strict';

let fs = require('fs');


module.exports.run = async (message, args, command, bot) => {
   if (message.author.id == process.env.bot_owner) {
      try {
         const code = args.join(' ');
         let evaled = eval(code);
         if (typeof evaled !== 'string') {
            evaled = require('util').inspect(evaled);
         }
         message.channel.send(evaled);
      } catch (err) {
         message.channel.send(`Error! ${err}`);
      }

   }
}

module.exports.help = {
   name: 'eval',
   help: 'you can\'t use this'
}