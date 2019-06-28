import { Message } from 'discord.js';
import { db } from './db';

const insertFav = db.get().prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');
const insertFilter = db.get().prepare('INSERT INTO filtered (id, source) VALUES (?, ?)');
const insertFirstReport = db.get().prepare('INSERT INTO reports (url, num, source) VALUES (?, 1, ?)');
const updateReport = db.get().prepare('UPDATE reports SET num = ? WHERE url = ?');

const deleteChan = db.get().prepare('DELETE FROM chancats WHERE no = ?');
const deleteBing = db.get().prepare('DELETE FROM bingcats WHERE id = ?');

const searchBing = db.get().prepare('SELECT * FROM bingcats WHERE url = ?');
const searchReports = db.get().prepare('SELECT * FROM reports WHERE url = ?');

export function handleFavorite(userID: string, url: string): void {
   insertFav.run(userID, url);
}

export function handleFilter(url: string, msg: Message): void {
   // check if its a 4cat first, because we dont need an sql call
   // as we can assume its already in the db, because we sent the message
   if (url.startsWith('https://i.4cdn.org/cm/')) {
      const no = url.substring(22, 35);
      deleteChan.run(no);
      insertFilter.run(no, 'chan');
      msg.react('🇫');
      return;
   }
   const isBing = searchBing.get(url);
   if (isBing) {
      deleteBing.run(isBing.id);
      insertFilter.run(isBing.id, 'bing');
      msg.react('🇫');
      return;
   }
   msg.react('⁉');
}

export function handleReport(url: string, msg: Message): void {
   // todo, one day we should add the reports to the bingcats or chancats db, no seperate table
   const isReported = searchReports.get(url);
   console.log(`hello! ${JSON.stringify(isReported, null, 2)}`);
   if (isReported) {
      // todo: remove our own reaction
      let numPlusOne = isReported.num;
      numPlusOne += 1;
      updateReport.run(numPlusOne, url);
      msg.react('😾');
      return;
   }
   const source = url.startsWith('https://i.4cdn.org/cm/') ? 'chan' : 'bing';
   insertFirstReport.run(url, source);
   msg.react('😾');
}
