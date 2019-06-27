const request = require('request-promise-native');
const { db } = require('./helper');

const insertImages = db.prepare('INSERT OR REPLACE INTO chancats (no, ext) VALUES(?, ?)');
const insertThread = db.prepare('INSERT OR REPLACE INTO threads (id, no) VALUES(?, ?)');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'chan\'');


const insertImagesRemoveFiltered = db.transaction((images, badImages) => {
   for (const image of images) {
      // since `no` are number literals, sqlite will
      // read them as `XXXXXXX.0` without .toString
      insertImages.run(image.no.toString(), image.ext);
   }
   for (const post of badImages) {
      deleteChan.run(post.id);
   }
});

function getJSON(url) {
   return new Promise((resolve, reject) => {
      request({
         uri: url,
         json: true,
      }).then(data => resolve(data)).catch(err => reject(err));
   });
}

function checkThread(singleThread) {
   const thread = singleThread;
   const regex = /cat\s?boy/i;
   if (!thread.sub) thread.sub = '';
   if (!thread.com) thread.com = '';
   if (thread.sub.match(regex) || thread.com.match(regex)) {
      return true;
   }
   return false;
   // return (!!(thread.sub.match(regex) || thread.com.match(regex)));
}

function update() {
   return new Promise(async (resolve) => {
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
         // drop the table if no good threads exist??
         // TODO: error handing lol
         // db.exec('DROP TABLE chancats');
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

      // add the threads we're using to the db, we use an int primary key
      // so we ALWAYS overwrite old data because 4chan threads expire.
      // we wont use a transaction because this is max ever 2 rows we're adding
      for (let i = 0; i < goodThreads.length; i += 1) {
         insertThread.run(i, goodThreads[i].toString());
      }

      try {
         const badPosts = searchFiltered.all();
         insertImagesRemoveFiltered(imgLinks, badPosts);
      } catch (e) {
         console.error(`Error! Failed to update the 4chan cats!\n${e}`);
      }
      return resolve();
   });
}

module.exports = {
   update,
};