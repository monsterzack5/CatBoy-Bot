import { Message } from 'discord.js';
import {
   insertFav,
   insertFilter,
   insertReport,
   deleteBingById,
   deleteChanByNo,
   searchBingByUrl,
   searchReportsByUrl,
} from './db';

export function handleFavorite(userID: string, url: string): void {
   insertFav.run(userID, url);
}

export function handleFilter(url: string, msg: Message): void {
   // check if its a 4cat first, because we dont need an sql call
   // as we can assume its already in the db, because we sent the message
   if (url.startsWith('https://i.4cdn.org/cm/')) {
      const no = url.substring(22, 35);
      deleteChanByNo.run(no);
      insertFilter.run(no, 'chan');
      msg.react('🇫');
      return;
   }
   const isBing = searchBingByUrl.get(url);
   if (isBing) {
      deleteBingById.run(isBing.id);
      insertFilter.run(isBing.id, 'bing');
      msg.react('🇫');
      return;
   }
   msg.react('⁉');
}

export function handleReport(url: string, msg: Message): void {
   // todo, one day we should add the reports to the bingcats or chancats db, no seperate table
   const isReported = searchReportsByUrl.get(url);
   if (isReported) {
      // todo: remove our own reaction
      isReported.num += 1;
      insertReport.run(isReported.url, isReported.num, url);
      msg.react('😾');
      return;
   }
   const source = url.startsWith('https://i.4cdn.org/cm/') ? 'chan' : 'bing or booru';
   insertReport.run(url, 1, source);
   msg.react('😾');
}
