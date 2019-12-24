import http from 'http';
import { schedule, ScheduledTask } from 'node-cron';
import { existsSync, mkdirSync } from 'fs';
import { Socket } from 'net';
import { exportFile } from './fileLoader';
import { db, memDb } from './db';
import { updateChan } from './4chan';
import { checkHealth } from './dbhealthcheck';
import { bot } from './bot';
import { updateRatios } from '../commands/catboy';

const openSockets: Set<Socket> = new Set();
const port = process.env.PORT || 5010;
let httpServer: http.Server;
let herokuPing: NodeJS.Timeout;
let updateCatRatios: NodeJS.Timeout;
let dbBackup: ScheduledTask;
let dbHeathCheck: ScheduledTask;

export function startTimers(): void {
   // create a http server that we can http get from our bot
   // so heroku doesnt disable the dyno from no traffic
   httpServer = http.createServer((_req, res): void => {
      res.end();
   }).listen(port);

   httpServer.on('connection', (socket) => {
      openSockets.add(socket);
      socket.on('close', () => {
         openSockets.delete(socket);
      });
   });

   updateCatRatios = setInterval(updateRatios, 600000);

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
   memDb.close();
   for (const socket of openSockets) {
      socket.destroy();
   }
   httpServer.close();
   dbBackup.destroy();
   dbHeathCheck.destroy();
   clearInterval(herokuPing);
   clearInterval(updateCatRatios);
   if (doArchive) {
      await exportFile(`${process.env.dbFile}.db`, true, undefined, false);
   } else {
      await exportFile(`${process.env.dbFile}.db`, false, undefined, true);
   }
   bot.destroy();
}

// We exit node gracefully, so we don't need to explicitly call process.exit()
process.on('SIGINT', async (): Promise<void> => {
   await stopBot();
});

// only archive the database on sigterm
process.on('SIGTERM', async (): Promise<void> => {
   await stopBot(true);
});
