import Q from 'p-queue';
import got from 'got';
import { db } from './db';
import { filterUrl } from './filter';
import { logger } from './logger';

// const selectAllBadUrls = db.prepare('SELECT * FROM badurls');

const selectAllChan = db.prepare('SELECT * FROM chancats');
const selectAllBing = db.prepare('SELECT * FROM bingcats');
const selectAllBooru = db.prepare('SELECT * FROM boorucats');
const selectFiltered = db.prepare('SELECT * FROM filtered WHERE id = ?');

// todo: a reason column seems like a good idea

async function checkUrl(url: string, permaDel = false): Promise<void> {
   try {
      // if the url is filtered, but we're checking it, that means
      // the url is in the db when it SHOULD BE FILTERED
      // our filter function has handling for this.
      if (url.startsWith('https://i.4cdn.org')) {
         const isAlreadyFiltered = selectFiltered.get(url.substring(22, 35));
         if (isAlreadyFiltered) {
            filterUrl(url, permaDel);
            return;
         }
      } else {
         // if the url isnt a chan one, we dont need to get a substring
         const isAlreadyFiltered = selectFiltered.get(url);
         if (isAlreadyFiltered) {
            filterUrl(url, permaDel);
            return;
         }
      }
      // get send a HEAD request to each url, to check if it returns a 404
      const resp = await got.head(url, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
         },
         throwHttpErrors: false,
      });
      // depending on your connection, the 5s response time can vary, but this bot
      // is meant for heroku, which has a aws connection, so 5s is generous
      if (resp.statusCode !== 200 || ((resp.timings.end || 0) - resp.timings.start) > 5000) {
         filterUrl(url, permaDel);
         return;
      }
      // if (fromBadUrls) {
      // if we're here, the URL is FINE and was saved to BadUrls
      // in the future, we'll reinstate these links to the main database
      // for now, they can just stay in limbo
      // }
   } catch (e) {
      filterUrl(url, permaDel);
   }
}

export async function checkHealth(): Promise<void> {
   const startTime = Date.now();
   const queue = new Q({
      concurrency: 15,
      timeout: 7500,
   });

   const chanUrls = selectAllChan.all()
      .map(url => `https://i.4cdn.org/cm/${url.no}${url.ext}`);
   const bingUrls = selectAllBing.all()
      .map(url => url.url);
   const booruUrls = selectAllBooru.all()
      .map(url => url.url);
   const allCatboyUrls = bingUrls.concat(chanUrls, booruUrls);

   // This checks the health of all the live URLs in our database
   for (const url of allCatboyUrls) {
      queue.add(() => checkUrl(url));
   }
   await queue.onIdle();

   db.exec('VACUUM');
   logger.log(`Checked db health! time taken: ${(Date.now() - startTime) / 1000} seconds!`);
}
