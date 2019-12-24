import got from 'got';
import { db } from './db';
import { updateRatios } from '../commands/catboy';
import { logger } from './logger';
import {
   Post, ImagePost, ArchivedThreads, FilteredImage, StoredThread, ThreadPosts,
} from '../typings/interfaces';

// Constants
// todo: allow multiple boards
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)';
const chanBoard = 'cm';
const regex = /cat\s?boy/i;


// Sqlite Calls
const insertImage = db.prepare('INSERT INTO chancats (posttime, postno, ext, height, width, filesize, md5, op) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
const insertThread = db.prepare('INSERT INTO threads (postno, status) VALUES(?, \'alive\')');

const updateStatus = db.prepare('UPDATE threads SET status = ? WHERE postno = ?');
const updateThread = db.prepare('UPDATE threads SET lastmodified = ?, totalposts = ? WHERE postno = ?');

const selAliveThreads = db.prepare('SELECT postno, status FROM threads WHERE status = \'alive\' OR status = \'archived\'');
const selectThread = db.prepare('SELECT lastmodified, totalposts FROM threads WHERE postno = ?');
const searchFiltered = db.prepare('SELECT id FROM filtered WHERE source = \'chan\'');

const deleteChancat = db.prepare('DELETE FROM chancats WHERE postno = ?');
const delCatsFromDeadThreads = db.prepare('DELETE FROM chancats WHERE postno = @postno OR op = @postno');

// Lamda for updating the db
const insertImagesRemoveFiltered = db.transaction((images: ImagePost[], badImages: FilteredImage[]): void => {
   for (const image of images) {
      insertImage.run(image.tim, image.no, image.ext, image.h,
         image.w, image.fsize, image.md5, image.resto);
   }
   for (const post of badImages) {
      deleteChancat.run(post.id);
   }
});

// returns all the posts on the catalog
async function getCatalogPosts(): Promise<Post[]> {
   try {
      // https://github.com/4chan/4chan-API/blob/master/pages/Catalog.md
      const req = await got(`https://a.4cdn.org/${chanBoard}/catalog.json`, {
         headers: {
            Agent: userAgent,
         },
         responseType: 'json',
      });

      const allLinks: Post[] = [];
      if (typeof req.body === 'object' && Array.isArray(req.body)) {
         for (const page of req.body) {
            allLinks.push(page.threads);
         }
         return allLinks.flat();
      }
      return [];
   } catch (e) {
      logger.error('getCatalogPosts::4chan', e);
      return [];
   }
}

// Get's a single thread, honors 4chan's If-Modified-Since header
async function getThread(thread: number): Promise<Post[] | []> {
   const { lastmodified, totalposts } = selectThread.get(thread);
   const headers: Record<string, string> = {
      Agent: userAgent,
   };

   if (lastmodified) {
      headers['If-Modified-Since'] = new Date(lastmodified).toUTCString();
   }

   try {
      // https://github.com/4chan/4chan-API/blob/master/pages/Threads.md
      const req = await got(`https://a.4cdn.org/${chanBoard}/thread/${thread}.json`, {
         headers,
         responseType: 'json',
      });
      const body = req.body as ThreadPosts;
      if (req.statusCode === 200) {
         const lastModms = new Date(req.headers['last-modified'] as string).getTime();
         updateThread.run(lastModms, body.posts.length, thread);
      } else if (req.statusCode === 304) {
         // if the api returns 304, then the thread has not been modified since last request
         return [];
      }

      // if totalposts = 0, return all .posts, if not, return all the posts after # totalposts
      return (totalposts === 0 ? body.posts : body.posts.slice(totalposts, body.posts.length));
   } catch (e) {
      // return an empty array on error
      logger.error('getThread::4chan', e);
      return [];
   }
}

// in: threads: number[] of threads NOT returned by the API, but are saved locally
// out: deletedThreads: threadID's that 4chan didn't return at all (and are locally saved)
// out: archivedThreads: threadID's that 4chan marked archived (and are locally saved)
async function checkArchive(threads: number[]): Promise<ArchivedThreads> {
   let deletedThreads: number[] = [];
   let archivedThreads: number[] = [];

   try {
      // https://github.com/4chan/4chan-API/blob/master/pages/Archive.md
      const req = await got(`https://a.4cdn.org/${chanBoard}/archive.json`, {
         headers: {
            Agent: userAgent,
         },
         responseType: 'json',
      });
      const body = req.body as number[];
      if (typeof req.body === 'object' && Array.isArray(req.body)) {
         deletedThreads = threads.filter(x => !body.includes(x));
         archivedThreads = threads.filter(x => body.includes(x));
      }
   } catch (e) {
      logger.error('checkArchive::4chan', e);
   }
   return {
      deletedThreads,
      archivedThreads,
   };
}

// check if a post passes the regex
function checkThread(post: Post): boolean {
   const thread = post;
   if (!thread.sub) thread.sub = '';
   if (!thread.com) thread.com = '';
   return !!(thread.sub.match(regex) || thread.com.match(regex));
}

// scrapes 4chan and updates chancats
export async function updateChan(): Promise<void> {
   const allCatalogPosts = await getCatalogPosts();
   const goodThreads: number[] = [];

   for (const thread of allCatalogPosts.filter(checkThread)) {
      goodThreads.push(thread.no);
   }

   // Load all threads marked 'alive' or 'archived'
   // transform threads into number[] of postno's
   const savedNotDeadThreads: number[] = selAliveThreads.all()
      .reduce((acc: number[], key: StoredThread) => {
         acc.push(key.postno);
         return acc;
      }, []);

   // if the thread in the db, but not in the catalog json, check if archived
   // if archived, set status to archived, if not archived, thread is dead
   const deadThreads = savedNotDeadThreads.filter(x => !goodThreads.includes(x));
   if (deadThreads.length) {
      const { deletedThreads, archivedThreads } = await checkArchive(deadThreads);
      for (const archivedThread of archivedThreads) {
         updateStatus.run('archived', archivedThread);
      }
      for (const deadThread of deletedThreads) {
         // this line replaces our sqlite trigger
         delCatsFromDeadThreads.run({ postno: deadThread });
         updateStatus.run('dead', deadThread);
      }
   }

   // if thread returned by api, not in db, add it
   const newThreads = goodThreads.filter(x => !savedNotDeadThreads.includes(x));
   for (const newThread of newThreads) {
      insertThread.run(newThread);
   }

   // make an array of promises of all thread info, transform post[][] -> post[] without 304 threads
   const threadInfoPromises: Promise<Post[]>[] = goodThreads.map(x => getThread(x));
   const allPosts = (await Promise.all(threadInfoPromises))
      .flat()
      .filter(x => x !== undefined);

   // iterate over all returned posts, and only return posts that contain images, cast as ImagePost
   const imgLinks = allPosts.filter((p: Post) => p.filename && p.ext !== '.webm') as ImagePost[];

   if (!imgLinks.length) {
      return;
   }

   try {
      const badPosts = searchFiltered.all();
      insertImagesRemoveFiltered(imgLinks, badPosts);
      updateRatios();
   } catch (e) {
      logger.error('updateChan::4chan', e);
   }
}
