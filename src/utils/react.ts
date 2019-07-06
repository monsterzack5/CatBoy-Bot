import { Message } from 'discord.js';
import { db } from './db';

const insertFav = db.prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');
const insertFilter = db.prepare('INSERT INTO filtered (id, source) VALUES (?, ?)');
const insertFirstReport = db.prepare('INSERT INTO reports (url, num, source) VALUES (?, 1, ?)');
const updateReport = db.prepare('UPDATE reports SET num = ? WHERE url = ?');

const deleteChan = db.prepare('DELETE FROM chancats WHERE no = ?');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE id = ?');
const deleteReport = db.prepare('DELETE FROM reports WHERE url = ?');

const searchBing = db.prepare('SELECT * FROM bingcats WHERE url = ?');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE id = ?');
const searchReports = db.prepare('SELECT * FROM reports WHERE url = ?');

export function handleFavorite(userID: string, url: string): void {
   insertFav.run(userID, url);
}

export function handleFilter(url: string, msg: Message): void {
   // extracting the crab react and the deleteReport to their own function
   // makes pretty much no difference
   if (url.startsWith('https://i.4cdn.org/cm/')) {
      const no = url.substring(22, 35);
      const isFiltered = searchFiltered.get(no);
      if (isFiltered) {
         deleteReport.run(url);
         msg.react('🦀');
         return;
      }
      insertFilter.run(no, 'chan');
      deleteChan.run(no);
      deleteReport.run(url);
      msg.react('🇫');
      return;
   }
   const isBing = searchBing.get(url);
   if (isBing) {
      const isFiltered = searchFiltered.get(isBing.id);
      if (isFiltered) {
         deleteReport.run(url);
         msg.react('🦀');
         return;
      }
      insertFilter.run(isBing.id, 'bing');
      deleteBing.run(isBing.id);
      deleteReport.run(url);
      msg.react('🇫');
      return;
   }
   // we're here if its a booru cat
   const isFiltered = searchFiltered.get(url);
   if (isFiltered) {
      deleteReport.run(url);
      msg.react('🦀');
      return;
   }
   insertFilter.run(url, 'booru');
   deleteReport.run(url);
   msg.react('🇫');
}

export function handleReport(url: string, msg: Message): void {
   // todo, one day we should add the reports to the bingcats or chancats db, no seperate table
   const isReported = searchReports.get(url);
   if (isReported) {
      // todo: remove our own reaction
      let numPlusOne = isReported.num;
      numPlusOne += 1;
      updateReport.run(numPlusOne, url);
      msg.react('😾');
      return;
   }
   const source = url.startsWith('https://i.4cdn.org/cm/') ? 'chan' : 'bing or booru';
   insertFirstReport.run(url, source);
   msg.react('😾');
}
