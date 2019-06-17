const fs = require('fs');
const request = require('request-promise-native');
const fileLoader = require('./fileLoader');

function getJSON(url) {
   return new Promise((resolve, reject) => {
      request({
         uri: url,
         json: true,
      }).then(data => resolve(data)).catch(err => reject(err));
   });
}


function checkThread(thread) {
   const regex = /cat\s?boy/i;
   if (!thread.sub) thread.sub = '';
   if (!thread.com) thread.com = '';
   if (thread.sub.match(regex) || thread.com.match(regex)) {
      return true;
   }
   return false;
}

async function update(bot) {
   const info = await getJSON('https://a.4cdn.org/cm/catalog.json');
   let goodThreads = [];
   let imgLinks;

   // do something for each page
   for (const page of info) {
      // filter each thread using the checkThread function passed to .filter
      goodThreads = goodThreads.concat(page.threads.filter(checkThread)
         .map(p => p.no));
   }

   // handling for if no threads exist
   if (!goodThreads.length) {
      // write an empty object to the db file if no good threads exist
      fs.writeFileSync(`${process.env.db_file}.json`, {});
      fileLoader.exportFile(bot, `${process.env.db_file}.json`);
   }

   // get all the posts in every thread that the last function returned
   const allThreadInfo = await Promise.all(goodThreads.map(thread => getJSON(`https://a.4cdn.org/cm/thread/${thread}.json`)));

   // do something for every thread
   for (const threadInfo of allThreadInfo) {
      // filter all posts where filename exists and ext !== webm, push object to array
      imgLinks = threadInfo.posts
         .filter(p => p.filename && p.ext !== '.webm')
         .map(p => ({
            no: p.tim,
            ext: p.ext,
         }));
   }

   const db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));
   db.goodThreads = goodThreads;
   db.posts = imgLinks;

   fs.writeFileSync(`${process.env.db_file}.json`, JSON.stringify(db, null, 2));
   fileLoader.exportFile(bot, `${process.env.db_file}.json`);
}

module.exports = {
   update,
};
