import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';
import { DiscordEmbedImageReply, RatioTuple } from '../typings/interfaces';

// these statements take a random number, and use it as the offset
// to select a random cat
const searchBing = db.prepare('SELECT * FROM bingcats LIMIT 1 OFFSET ?');
const searchChan = db.prepare('SELECT * FROM chancats LIMIT 1 OFFSET ?');
const searchBooru = db.prepare('SELECT * FROM boorucats LIMIT 1 OFFSET ?');

// Statments to get the db size for ratios
const countBing = db.prepare('SELECT COUNT(*) FROM bingcats');
const countChan = db.prepare('SELECT COUNT(*) FROM chancats');
const countBooru = db.prepare('SELECT COUNT(*) FROM boorucats');

// count the catboys
const updateBing = db.prepare('INSERT INTO userstats (uid, bing) VALUES(?, 1) ON CONFLICT(uid) DO UPDATE SET bing = bing + 1');
const updateChan = db.prepare('INSERT INTO userstats (uid, chan) VALUES(?, 1) ON CONFLICT(uid) DO UPDATE SET chan = chan + 1');
const updateBooru = db.prepare('INSERT INTO userstats (uid, booru) VALUES(?, 1) ON CONFLICT(uid) DO UPDATE SET booru = booru + 1');

// declare some namespace variables
let dbRatios: RatioTuple;
let bingCount: number;
let chanCount: number;
let booruCount: number;

// this function create's a discord embed, from an image url and an optional source url
function embedBuilder(url: string, source?: string): DiscordEmbedImageReply {
   const color = parseInt((randomColor() as string).substring(1), 16);
   const description = !source ? '' : `[Source](${source})`;
   return {
      embed: {
         color,
         description,
         image: {
            url,
         },
      },
   };
}

// returns a cat from bing
function bingCat(uid: string): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = embedBuilder(cat.url, source);
   updateBing.run(uid);
   return reply;
}

// return a cat from 4chan
function chanCat(uid: string): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.posttime}${cat.ext}`;
   const threadWithPost = (cat.op !== 0) ? `${cat.op}#p${cat.postno}` : `${cat.postno}#p${cat.postno}`;
   const reply = embedBuilder(url, `https://boards.4channel.org/cm/thread/${threadWithPost}`);
   updateChan.run(uid);
   return reply;
}

// return a cat from the booru's
function booruCat(uid: string): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * booruCount);
   const cat = searchBooru.get(random);
   const reply = embedBuilder(cat.url, cat.source);
   updateBooru.run(uid);
   return reply;
}

// updates the ratio's for the db
export function updateRatios(): void {
   bingCount = countBing.get()['COUNT(*)'];
   chanCount = countChan.get()['COUNT(*)'];
   booruCount = countBooru.get()['COUNT(*)'];
   const totalSize = bingCount + chanCount + booruCount;
   dbRatios = [{
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
}
updateRatios();

// periodically update the ratios
setInterval(updateRatios, 600000);

// gets a random cat from our db
export function getRandomCat(uid: string): DiscordEmbedImageReply | void {
   // picks a random number between 0 and 1
   const randomSearch = Math.random();
   if (randomSearch < dbRatios[0].ratio) {
      return dbRatios[0].source(uid);
   }
   if (randomSearch > dbRatios[0].ratio && randomSearch < dbRatios[1].ratio) {
      return dbRatios[1].source(uid);
   }
   if (randomSearch > dbRatios[1].ratio) {
      return dbRatios[2].source(uid);
   }
   // this should be impossible to reach
   return undefined;
}

// this runs when you do !catboy
export default async (message: Message): Promise<void> => {
   const reply = getRandomCat(message.author.id);
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Sends a random catboy :cat:',
   timeout: 1000,
};
