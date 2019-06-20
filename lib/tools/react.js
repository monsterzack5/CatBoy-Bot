const fs = require('fs');
const fileLoader = require('./fileLoader');

let db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));

// watch for any changes to the db, update if a change occurs
fs.watch(`./${process.env.db_file}.json`, () => {
   if (process.uptime() > 5) {
      console.log('Updating DB!');
      setTimeout(() => {
         db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`, 'utf8'));
      }, 2000);
   }
});

async function handleReact(userID, url, bot) {
   db.favorites[userID] = url;
   fs.writeFileSync(`./${process.env.db_file}.json`, JSON.stringify(db, null, 2));
   fileLoader.exportFile(`${process.env.db_file}.json`);
}

module.exports = {
   handleReact,
};
