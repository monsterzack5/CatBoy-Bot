const fs = require('fs');
const colors = require('randomcolor');

let db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));

// watch for any changes to the db, update if a change occurs
fs.watch(`./${process.env.db_file}.json`, () => {
   if (process.uptime() > 5) {
      setTimeout(() => {
         db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`, 'utf8'));
      }, 2000);
   }
});

module.exports.run = async (message) => {
   const catboy = Object.keys(db.favorites).find(key => key === message.author.id);

   if (catboy) {
      const color = parseInt(colors.randomColor().substring(1), 16);
      return message.channel.send({
         embed: {
            color,
            image: {
               url: db.favorites[catboy],
            },
         },
      });
   }
   return message.channel.send('You don\'t have a favorite catboy! React with :cat: to one of my messages to select your favorite catboy!')
      .then(msg => msg.delete(5000));
};

module.exports.help = {
   name: 'mycatboy',
   help: 'sends your own personal catboy',
};
