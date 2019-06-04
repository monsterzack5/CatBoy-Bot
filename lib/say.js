'use strict';
module.exports.run = async (message, args, command, bot) => {
    message.channel.send(args.join(' '));
}

module.exports.help = {
    name:'say',
    help: 'echos a message'
}