import Q from 'p-queue';
import got from 'got';
import { db } from './db';
import { logger } from './logger';
/**
 * this file is meant to be run once a day, and to check the health of the DB
 * this will http-get all links and make sure they return a 200 status code
 */
const selectAllChan = db.prepare('SELECT * FROM chancats');
const selectAllBing = db.prepare('SELECT * FROM bingcats');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE url = ?');

const insertBadUrl = db.prepare('INSERT OR REPLACE INTO badurls (url, source) VALUES (? , ?)');

let filtered = 0;

function filterUrl(url: string): void {
   filtered += 1;
   if (url.startsWith('https://i.4cdn.org/cm/')) {
      const no = url.substring(22, 35);
      deleteChan.run(no);
      insertBadUrl.run(no, 'chan');
      return;
   }
   deleteBing.run(url);
   insertBadUrl.run(url, 'bing');
}

async function checkUrl(url: string): Promise<void> {
   try {
      const resp = await got.head(url, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
         },
         throwHttpErrors: false,
      });
      // depending on your connection, the 5s response time can vary, but this bot
      // is meant for heroku, which has a aws connection, so 5s is generous
      if (resp.statusCode !== 200 || (resp.timings.end - resp.timings.start) > 5000) {
         filterUrl(url);
         return;
      }
   } catch (e) {
      // the website could be down at the time of running this function
      // I think the best idea would be to remove the URLs from the main tables
      // and store them in a possiblybadurls table, where we can check them again. TODO
      filterUrl(url);
   }
}

export async function checkHealth(): Promise<void> {
   const queue = new Q({
      concurrency: 15,
      timeout: 7500,
   });
   filtered = 0;
   const chanUrls = selectAllChan.all()
      .map(url => `https://i.4cdn.org/cm/${url.no}${url.ext}`);
   const bingUrls = selectAllBing.all()
      .map(url => url.url);
   const urls = bingUrls.concat(chanUrls);
   for (const url of urls) {
      queue.add(() => checkUrl(url));
   }
   await queue.onEmpty();
   // wait for 7.5 seconds because onEmpty returns when the Q is empty,
   // not when all the promises are completed
   await new Promise(resolve => setTimeout(resolve, 7500));
   if (filtered > 0) {
      logger.log(`Filtered ${filtered} urls`);
   }
}
