import http from 'http';
import { schedule, ScheduledTask } from 'node-cron';
import { existsSync, mkdirSync } from 'fs';
import { exportFile } from './fileLoader';
import { db } from './db';
import { updateChan } from './4chan';
import { checkHealth } from './dbhealthcheck';
import { bot } from './bot';

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
      try {
         await updateChan();
         await db.backup(`./tmp/${process.env.dbFile}.db`);
      } catch (e) {
         console.error(`Error!\n${e} `);
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

async function stopBot(doArchive?: boolean): Promise<void> {
   console.log('Goodbye!');
   db.close();
   httpServer.close();
   dbBackup.destroy();
   dbHeathCheck.destroy();
   clearInterval(herokuPing);
   if (doArchive) {
      await exportFile(`${process.env.dbFile}.db`, true);
   } else {
      await exportFile(`${process.env.dbFile}.db`);
   }
   bot.destroy();
   return Promise.resolve();
}

process.on('SIGINT', async (): Promise<void> => {
   await stopBot();
   process.exit(0);
});

// only archive the database on sigterm
process.on('SIGTERM', async (): Promise<void> => {
   await stopBot(true);
   process.exit(0);
});
