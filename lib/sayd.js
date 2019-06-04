'use strict';
module.exports.run = async (message, args, command, bot) => {
  if (message.guild.member(bot.user).hasPermission('MANAGE_MESSAGES')) {
    if (args.length == 0) return message.channel.send('I Can\'t say nothing!')
      .then(msg => msg.delete(1500))
      .then(message.delete(1500));
    message.channel.send(args.join(' '));
    message.delete();
  } else {
    message.channel.send('I can\'t delete messages you twat')
      .then(msg => msg.delete(3000));
  }
}

module.exports.help = {
  name: 'sayd',
  help: 'echos a message, then deletes the original message'
}