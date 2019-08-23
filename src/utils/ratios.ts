import { db } from './db';
import { bingCat, chanCat, booruCat } from '../commands/catboy';
import { RatioTuple } from '../typings/interfaces';
// this file will serve as the namespace for the ratios

const countBing = db.prepare('SELECT COUNT(*) FROM bingcats');
const countChan = db.prepare('SELECT COUNT(*) FROM chancats');
const countBooru = db.prepare('SELECT COUNT(*) FROM boorucats');

// let bingCount: number = countBing.get()['COUNT(*)'];
// let chanCount: number = countChan.get()['COUNT(*)'];
// let booruCount: number = countBooru.get()['COUNT(*)'];

export function getDbRatios(): { dbRatios: RatioTuple; bingCount: number; chanCount: number; booruCount: number } {
   const bingCount: number = countBing.get()['COUNT(*)'];
   const chanCount: number = countChan.get()['COUNT(*)'];
   const booruCount: number = countBooru.get()['COUNT(*)'];
   const totalSize = bingCount + chanCount + booruCount;
   const dbRatios: RatioTuple = [{
      source: bingCat,
      ratio: bingCount / totalSize,
   },
   {
      source: chanCat,
      ratio: chanCount / totalSize,
   },
   {
      source: booruCat,
      ratio: booruCount / totalSize,
   }];
   dbRatios.sort((a, b) => a.ratio - b.ratio);
   return {
      dbRatios,
      bingCount,
      chanCount,
      booruCount,
   };
}
