const colors = require('randomcolor');
const { db } = require('./tools/helper');

const search = db.prepare('SELECT url FROM favorites WHERE uid = ?');

module.exports.run = async (message) => {
   const catboy = search.get(message.author.id);

   if (catboy) {
      const color = parseInt(colors.randomColor().substring(1), 16);
      return message.channel.send({
         embed: {
            color,
            image: {
               url: catboy.url,
            },
         },
      });
   }
   return message.channel.send('You don\'t have a favorite catboy! React with :cat: to one of my messages to select your favorite catboy!')
      .then(msg => msg.delete(8000));
};

module.exports.help = {
   name: 'mycatboy',
   help: 'sends your own personal catboy',
};
