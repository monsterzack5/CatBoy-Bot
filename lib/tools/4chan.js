'use strict';

const fs = require('fs');
const request = require('request-promise-native');
const fileLoader = require('./fileLoader');


async function update(bot) {
   const allPosts = await getJSON(`https://a.4cdn.org/cm/catalog.json`);
   let threads = [];
   let allThreadInfo = [];
   let imgLinks = [];

   // do something for each page
   for (let i = 0; i < allPosts.length; i++) {
      // do something for each thread on each page
      for (let j = 0; j < allPosts[i].threads.length; j++) {
         // if you used continue and an if with ||, if skips over all threads
         // with no `sub`ject. Which is something we don't want.
         if (allPosts[i].threads[j].sub === undefined) allPosts[i].threads[j].sub = '';
         if (allPosts[i].threads[j].com === undefined) allPosts[i].threads[j].com = '';

         // matches `catboy` and `cat boy`
         const regex = /cat\s?boy/i;
         if (allPosts[i].threads[j].sub.match(regex) || allPosts[i].threads[j].com.match(regex)) {
            // skip any thread without any images
            if (allPosts[i].threads[j].images === 0) continue;
            threads.push(allPosts[i].threads[j].no);
         }
      }
   }

   // handling for if no threads exist
   if (threads.length === 0) {
      // todo
   }

   // get every post from every thread we stored in `threads`
   for (let k = 0; k < threads.length; k++) {
      let data = await getJSON(`https://a.4cdn.org/cm/thread/${threads[k]}.json`);
      allThreadInfo.push(data);
   }

   // do something for every thread's JSON
   for (let l = 0; l < allThreadInfo.length; l++) {
      // do something for every post in the thread
      for (let m = 0; m < allThreadInfo[l].posts.length; m++) {
         if (allThreadInfo[l].posts[m].filename === undefined) continue;
         if (allThreadInfo[l].posts[m].ext === '.webm') continue;
         imgLinks.push({
            no: allThreadInfo[l].posts[m].tim,
            ext: allThreadInfo[l].posts[m].ext
         });
      }
   }

   // format the db object before writing to disk
   const db = {
      threads: threads,
      posts: imgLinks
   }
   fs.writeFileSync(`./${process.env.db_file}.json`, JSON.stringify(db));
   fileLoader.exportFile(bot, `${process.env.db_file}.json`);
}

async function getJSON(url) {
   return new Promise((resolve) => {
      request({
         uri: url,
         json: true
      }).then((data) => {
         return resolve(data);
      }).catch((err) => {
         return reject(`(4chan:getJSON)Error!\n${err}`);
      });
   });
}

module.exports = {
   update
}