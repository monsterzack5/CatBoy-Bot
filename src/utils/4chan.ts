import got from 'got';
import { OutgoingHttpHeaders } from 'http';
import { db } from './db';
import { updateRatios } from '../commands/catboy';
import {
   ChanImage, Post, ImagePost, CatalogPage, ThreadResponse, ArchivedThreads,
} from '../typings/interfaces';
import { logger } from './logger';

const insertImages = db.prepare('INSERT INTO chancats (no, ext, height, width, filesize, md5, op) VALUES(?, ?, ?, ?, ?, ?, ?)');
const insertThread = db.prepare('INSERT INTO threads (no, status) VALUES(?, \'alive\')');

const updateStatus = db.prepare('UPDATE threads SET status = ? WHERE no = ?');
const updateLastMod = db.prepare('UPDATE threads SET lastmodified = ? WHERE no = ?');

const selAliveThreads = db.prepare('SELECT no FROM threads WHERE status = \'alive\' OR status = \'archived\'');
const selectLastMod = db.prepare('SELECT lastmodified FROM threads WHERE no = ?');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'chan\'');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');

/**
 * Outline of file:
 * catalog: JSON of all threads on board
 * goodThreads: all threadIDs from catalog where thread passes checkThread()
 * savedThreads: string[] of all threadIDs from db where status = alive or archived
 * deadThreads: threadIDs found in DB, that were NOT returned by api
 *    if deadThreads, check if given threads are archived
 *    if archived, change status to archived
 *    if deleted, change sstatus to dead
 * newThreads: threadIDs not in db, that were returned by the api
 * if no returned threads, and no saved threads, delete table, update ratios
 * allThreadInfo: object[] containing JSON from all goodThreads
 * if allThreadinfo is empty, return (when all threads send code 304)
 * for allThreadInfo: get all image posts from every thread JSON, return info object per image
 * badPosts: all filtered images from db
 *
 * functions:
 * getCatalog: returns catalog JSON
 * getThread: checks if url has saved lastmodified time, if so get thread JSON
 *    using an if-modified-since header, if return 304 thread not modified
 *    update last modified time in db if changed
 * checkArchive: gets all archived threadIDs, checks them against inputed threadIDs
 *    deletedThreads: threadIDs in db, that are not archived
 *    archivedThreads: threadIDs in db, that are archived
 *
 * sqlite triggers:
 * remove_dead_links: triggers when `status` column from `threads` table gets
 *    updated to 'dead', remove all rows from `chancats` when OP thread
 *    has been marked 'dead'
 */

const insertImagesRemoveFiltered = db.transaction((images, badImages): void => {
   for (const image of images) {
      // using .toString stops sqlite from appending .0 to integers
      insertImages.run(image.no.toString(), image.ext, image.height.toString(),
         image.width.toString(), image.filesize.toString(), image.md5, image.op.toString());
   }
   for (const post of badImages) {
      deleteChan.run(post.id);
   }
});

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
      return logger.error('getCatalog::4chan', e);
   }
}

async function getThread(thread: string): Promise<ThreadResponse | void> {
   const lastModified = selectLastMod.get(thread).lastmodified;
   const headers: OutgoingHttpHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)',
   };
   if (lastModified) {
      headers['If-Modified-Since'] = new Date(lastModified).toUTCString();
   }
   try {
      const req = await got(`https://a.4cdn.org/cm/thread/${thread}.json`, {
         headers,
         json: true,
      });
      if (req.statusCode === 200) {
         const lastModms = new Date(req.headers['last-modified'] as string).getTime().toString();
         updateLastMod.run(lastModms, thread);
      } else if (req.statusCode === 304) {
         // if the api returns 304, then the thread has not been modified since last request
         return undefined;
      }
      return req.body;
   } catch (e) {
      return logger.error('getThread::4chan', e);
   }
}

async function checkArchive(threads: string[]): Promise<ArchivedThreads> {
   try {
      const req = await got('https://a.4cdn.org/cm/archive.json', {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)',
         },
         json: true,
      });
      const archived: string[] = req.body.map((x: number) => x.toString());
      return {
         deletedThreads: threads.filter(x => !archived.includes(x)),
         archivedThreads: threads.filter(x => archived.includes(x)),
      };
   } catch (e) {
      logger.error('checkArchive::4chan', e);
      return {
         deletedThreads: [],
         archivedThreads: [],
      };
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
   const catalog = await getCatalog() as CatalogPage[];
   let goodThreads: string[] = [];
   let imgLinks: ChanImage[] = [];

   // do something for each page
   for (const page of catalog) {
      // filter each thread using the checkThread function passed to .filter
      if (page.threads) {
         goodThreads = goodThreads.concat(page.threads.filter(checkThread)
            .map((p: Post): string => p.no.toString()));
      }
   }

   const savedThreads: string[] = selAliveThreads.all().reduce((acc, key) => acc.concat(key.no.toString()), []);

   // if thread in db, but not in goodThreads, check if archived
   // if archived, set status to archived, if not archived, thread is dead
   const deadThreads = savedThreads.filter(x => !goodThreads.includes(x));
   if (deadThreads.length) {
      const { deletedThreads, archivedThreads } = await checkArchive(deadThreads);
      for (const deadThread of deletedThreads) {
         updateStatus.run('dead', deadThread);
      }
      for (const archivedThread of archivedThreads) {
         updateStatus.run('archived', archivedThread);
      }
   }

   // if thread returned by api, not in db, add it
   const newThreads = goodThreads.filter(x => !savedThreads.includes(x));
   for (const newThread of newThreads) {
      insertThread.run(newThread);
   }

   const allThreadInfo = (await Promise.all(goodThreads.map(thread => getThread(thread)))).filter(x => x !== undefined);
   // return if no good threadInfo was returned, ie no thread has been modified
   if (!allThreadInfo.length) {
      return;
   }

   // do something for every thread returned
   for (const threadInfo of allThreadInfo) {
      // filter all posts where filename exists and ext !== webm, push object to array
      imgLinks = imgLinks.concat((threadInfo as ThreadResponse).posts
         .filter((p: Post) => p.filename && p.ext !== '.webm')
         .map((p: Post) => {
            const ip = p as ImagePost;
            if (ip.resto === 0) {
               ip.resto = ip.no;
            }
            return {
               no: ip.tim,
               ext: ip.ext,
               height: ip.h,
               width: ip.w,
               filesize: ip.fsize,
               md5: ip.md5,
               op: ip.resto,
            };
         }));
   }

   try {
      const badPosts = searchFiltered.all();
      insertImagesRemoveFiltered(imgLinks, badPosts);
      updateRatios();
   } catch (e) {
      logger.error('updateChan::4chan', e);
   }
}
