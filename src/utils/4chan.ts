import got from 'got';
import { db } from './db';
import {
   ChanImage, Post, ImagePost, CatalogPage, ThreadResponse,
} from '../typings/interfaces';

const insertImages = db.prepare('INSERT OR REPLACE INTO chancats (no, ext) VALUES(?, ?)');
const insertThread = db.prepare('INSERT OR REPLACE INTO threads (id, no) VALUES(?, ?)');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'chan\'');

const insertImagesRemoveFiltered = db.transaction((images, badImages): void => {
   for (const image of images) {
      // since `no` are number literals, sqlite will
      // read them as `XXXXXXX.0` without .toString
      insertImages.run(image.no.toString(), image.ext);
   }
   for (const post of badImages) {
      deleteChan.run(post.id);
   }
});

async function getThread(threadNo: number): Promise<ThreadResponse | void> {
   try {
      const req = await got(`https://a.4cdn.org/cm/thread/${threadNo}.json`, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)',
         },
         json: true,
      });
      return req.body;
   } catch (e) {
      return console.error(`Error Getting thread info:\n${e}`);
   }
}

async function getCatalog(): Promise<CatalogPage[] | void> {
   try {
      const req = await got('https://a.4cdn.org/cm/catalog.json', {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)',
         },
         json: true,
      });
      return req.body;
   } catch (e) {
      return console.error(`Error Getting catalog info:\n${e}`);
   }
}

function checkThread(singleThread: Post): boolean {
   const thread = singleThread;
   const regex = /cat\s?boy/i;
   if (!thread.sub) thread.sub = '';
   if (!thread.com) thread.com = '';
   return !!(thread.sub.match(regex) || thread.com.match(regex));
}

export async function updateChan(): Promise<void> {
   const info = await getCatalog() as CatalogPage[];
   let goodThreads: number[] = [];
   let imgLinks: ChanImage[] = [];

   // do something for each page
   for (const page of info) {
      // filter each thread using the checkThread function passed to .filter
      if (page.threads) {
         goodThreads = goodThreads.concat(page.threads.filter(checkThread)
            .map((p: Post) => p.no));
      }
   }

   // todo: lol
   // handling for if no threads exist
   if (!goodThreads.length) {
      // drop the table if no good threads exist??
      // TODO: error handing lol
      // db.exec('DROP TABLE chancats');
   }

   // get all the posts in every thread that the last function returned
   const allThreadInfo = await Promise.all(goodThreads.map(thread => getThread(thread)));

   // do something for every thread
   for (const threadInfo of allThreadInfo) {
      // filter all posts where filename exists and ext !== webm, push object to array
      imgLinks = imgLinks.concat((threadInfo as ThreadResponse).posts
         .filter((p: Post) => p.filename && p.ext !== '.webm')
         .map((p: Post) => {
            const ip = p as ImagePost;
            return {
               no: ip.tim,
               ext: ip.ext,
            };
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
}
