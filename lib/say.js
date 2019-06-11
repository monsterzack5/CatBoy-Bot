module.exports.run = async (message, args) => {
   message.channel.send(args.join(' '));
};

module.exports.help = {
   name: 'say',
   help: 'echos a message',
};
