module.exports.run = async (message, args, command, bot) => {
   if (message.guild.member(bot.user).hasPermission('MANAGE_MESSAGES')) {
      if (args.length === 0) return message.react('❌');
      message.channel.send(args.join(' '));
      return message.delete();
   }
   return message.react('❌');
};

module.exports.help = {
   name: 'sayd',
   help: 'echos a message, then deletes the original message',
};
