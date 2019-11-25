import { db } from './db';
import { logger } from './logger';

const insertFilter = db.prepare('INSERT INTO filtered (id, source) VALUES (?, ?)');

const deleteChan = db.prepare('DELETE FROM chancats WHERE postno = ?');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE id = ?');
const deleteReport = db.prepare('DELETE FROM reports WHERE url = ?');
const deleteBooru = db.prepare('DELETE FROM boorucats WHERE url = ?');

const selectBing = db.prepare('SELECT * FROM bingcats WHERE url = ?');
const selectFiltered = db.prepare('SELECT * FROM filtered WHERE id = ?');
const selectBooru = db.prepare('SELECT * FROM boorucats WHERE url = ?');

const insertBadUrl = db.prepare('INSERT OR REPLACE INTO badurls (url, source) VALUES (? , ?)');

// FIXME: the fallthrough case of a url being bing+booru will
// result in an sql unique error

// FIXME: check if url is in favs table, fix if so
function filterChan(url: string): boolean {
   if (url.startsWith('https://i.4cdn.org')) {
      const postNumber = url.substring(22, 35);
      const isAlreadyFiltered = selectFiltered.get(postNumber);
      if (isAlreadyFiltered) {
         deleteReport.run(url);
         const wasDeleted = deleteChan.run(url);
         return wasDeleted.changes > 0;
      }
      insertFilter.run(postNumber, 'chan');
      insertBadUrl.run(postNumber, 'chan');
      deleteChan.run(postNumber);
      deleteReport.run(url);
      logger.log(`Filtered catboy from chan table with url: \`${url}\``);
      return true;
   }
   return false;
}

function filterBing(url: string): boolean {
   const isBing = selectBing.get(url);
   if (isBing) {
      const isAlreadyFiltered = selectFiltered.get(url);
      if (isAlreadyFiltered) {
         deleteReport.run(url);
         const wasDeleted = deleteBing.run(url);
         return wasDeleted.changes > 0;
      }
      insertFilter.run(url, 'bing');
      insertBadUrl.run(url, 'bing');
      deleteBing.run(url);
      deleteReport.run(url);
      logger.log(`Filtered catboy from bing table with url: \`${url}\``);
      return true;
   }
   return false;
}

function filterBooru(url: string): boolean {
   const isBooru = selectBooru.get(url);
   if (isBooru) {
      const isAlreadyFiltered = selectFiltered.get(url);
      if (isAlreadyFiltered) {
         deleteReport.run(url);
         const wasDeleted = deleteBooru.run(url);
         return wasDeleted.changes > 0;
      }
      insertFilter.run(url, 'booru');
      insertFilter.run(url, 'booru');
      deleteBooru.run(url);
      deleteReport.run(url);
      logger.log(`Filtered catboy from booru table with url: \`${url}\``);
      return true;
   }
   return false;
}


export function filterUrl(url: string): boolean {
   const didChanFilter = filterChan(url);
   const didBingFilter = filterBing(url);
   const didBooruFilter = filterBooru(url);
   return (didChanFilter || didBingFilter || didBooruFilter);
}
