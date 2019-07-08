import http from 'http';
import { schedule, ScheduledTask } from 'node-cron';
import { existsSync, mkdirSync } from 'fs';
import { exportFile } from './utils/fileLoader';
import { db } from './utils/db';
import { updateChan } from './utils/4chan';
import { checkHealth } from './utils/dbhealthcheck';

const port = process.env.PORT || 5010;
let httpServer: http.Server;
let herokuPing: NodeJS.Timeout;
let dbBackup: ScheduledTask;
let dbHeathCheck: ScheduledTask;

export function startTimers(): void {
   // create a http server that we can http get from our bot
   // so heroku doesnt disable the dyno from no traffic
   httpServer = http.createServer((_req, res): void => {
      res.end();
   }).listen(port);

   if (process.env.NODE_ENV === 'production') {
      // ping our dyno every 15 minutes so heroku doesnt murder it
      herokuPing = setInterval((): void => {
         http.get('http://catbitchbot.herokuapp.com');
      }, 900000);
   }

   // update the 4chan db, then backup the .db, then export the .db, every 5 minutes
   dbBackup = schedule('*/5 * * * *', async (): Promise<void> => {
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

   dbHeathCheck = schedule('0 23 * * *', () => {
      checkHealth();
   });
   
   // updates our bing catboy db once a day at 1pm
   // disabled until further notice
   // schedule('0 13 * * *', (): void => {
   //    updateBing();
   // });
}

export function stopTimers(): void {
   httpServer.close();
   clearInterval(herokuPing);
   dbBackup.destroy();
   dbHeathCheck.destroy();
}
