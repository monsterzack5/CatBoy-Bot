module.exports.run = async (message) => {
   message.channel.send('You can invite me with this link!\nhttps://discordapp.com/api/oauth2/authorize?client_id=583860663760453650&permissions=0&scope=bot');
};

module.exports.help = {
   name: 'invite',
   help: 'sends my invite link',
};