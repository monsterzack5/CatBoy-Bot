import http from 'http';
import { schedule } from 'node-cron';
import { existsSync, mkdirSync } from 'fs';
import { exportFile } from './utils/fileLoader';
import { db } from './utils/db';
import { updateChan } from './utils/4chan';

const port = process.env.PORT || 5010;
export function startTimers(): void {
   // create a http server that we can http get from our bot
   // so heroku doesnt disable the dyno from no traffic
   http.createServer((_req, res): void => {
      res.end();
   }).listen(port);

   if (process.env.NODE_ENV === 'production') {
      // ping our dyno every 15 minutes so heroku doesnt murder it
      setInterval((): void => {
         http.get('http://catbitchbot.herokuapp.com');
      }, 900000);
   }

   // update the 4chan db, then backup the .db, then export the .db, every 5 minutes
   schedule('*/5 * * * *', async (): Promise<void> => {
      if (!existsSync('./tmp/')) {
         mkdirSync('./tmp/');
      }
      await updateChan();
      try {
         await db.backup(`./tmp/${process.env.dbFile}.db`);
      } catch (e) {
         console.error(`Error! Failed to backup the db!\n${e} `);
      }
      await exportFile(`./tmp/${process.env.dbFile}.db`);
   });

   // updates our bing catboy db once a day at 1pm
   // disabled until further notice
   // schedule('0 13 * * *', (): void => {
   //    updateBing();
   // });
}
