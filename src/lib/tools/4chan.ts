import request from 'request-promise-native';
import { db } from './db';

const insertImages = db.get().prepare('INSERT OR REPLACE INTO chancats (no, ext) VALUES(?, ?)');
const insertThread = db.get().prepare('INSERT OR REPLACE INTO threads (id, no) VALUES(?, ?)');

const deleteChan = db.get().prepare('DELETE FROM chancats WHERE no = ?');
const searchFiltered = db.get().prepare('SELECT * FROM filtered WHERE source = \'chan\'');


const insertImagesRemoveFiltered = db.get().transaction((images, badImages): void => {
   for (const image of images) {
      // since `no` are number literals, sqlite will
      // read them as `XXXXXXX.0` without .toString
      insertImages.run(image.no.toString(), image.ext);
   }
   for (const post of badImages) {
      deleteChan.run(post.id);
   }
});

function getThread(threadNo: number): Promise<ThreadResponse> {
   return new Promise(async (resolve, reject): Promise<void> => {
      try {
         const req = await request({
            uri: `https://a.4cdn.org/cm/thread/${threadNo}.json`,
            json: true,
         });
         return resolve(req);
      } catch (e) {
         return reject(e);
      }
   });
}

function getCatalog(): Promise<CatalogPage[]> {
   return new Promise(async (resolve, reject): Promise<void> => {
      try {
         const req = await request({
            uri: 'https://a.4cdn.org/cm/catalog.json',
            json: true,
         });
         return resolve(req);
      } catch (e) {
         return reject(e);
      }
   });
}

function checkThread(singleThread: Post): boolean {
   const thread = singleThread;
   const regex = /cat\s?boy/i;
   if (!thread.sub) thread.sub = '';
   if (!thread.com) thread.com = '';
   if (thread.sub.match(regex) || thread.com.match(regex)) {
      return true;
   }
   return false;
}

export function updateChan(): Promise<void> {
   return new Promise(async (resolve): Promise<void> => {
      const info = await getCatalog();
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
         imgLinks = imgLinks.concat(threadInfo.posts
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
      return resolve();
   });
}

interface ChanImage {
   ext: string;
   no: number;
}

interface Post {
   tim?: number;
   ext?: string;
   no: number;
   sub: string;
   com: string;
   filename: string;
}

interface ImagePost {
   tim: number;
   ext: string;
   no: number;
   sub: string;
   com: string;
   filename: string;
}

interface CatalogPage {
   threads: ImagePost[];
   page: number;
}

interface ThreadResponse extends Post {
   posts: Post[];
}
