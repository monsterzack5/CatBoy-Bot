import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';
import { DiscordEmbedImageReply, RatioTuple } from '../typings/interfaces';

// these statements get the number of entries for each cat table
const countBing = db.prepare('SELECT COUNT(*) FROM bingcats');
const countChan = db.prepare('SELECT COUNT(*) FROM chancats');
const countBooru = db.prepare('SELECT COUNT(*) FROM boorucats');

// these statements take a random number, and use it as the offset
// to select a random cat
const searchBing = db.prepare('SELECT * FROM bingcats LIMIT 1 OFFSET ?');
const searchChan = db.prepare('SELECT * FROM chancats LIMIT 1 OFFSET ?');
const searchBooru = db.prepare('SELECT * FROM boorucats LIMIT 1 OFFSET ?');

// these vars hold the total number of items of every table
let bingCount = countBing.get()['COUNT(*)'];
let chanCount = countChan.get()['COUNT(*)'];
let booruCount = countBooru.get()['COUNT(*)'];

// this function create's a discord embed, from an image url and an optional source url
function embedBuilder(source: string | undefined, url: string): DiscordEmbedImageReply {
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
function bingCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = embedBuilder(source, cat.url);
   return reply;
}

// return a cat from 4chan
function chanCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
   const reply = embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
   return reply;
}

// return a cat from the booru's
function booruCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * booruCount);
   const cat = searchBooru.get(random);
   const reply = embedBuilder(cat.source, cat.url);
   return reply;
}

// this function generates the ratio's to use
// when selecting what cat to send
function getDbRatios(): RatioTuple {
   const totalSize = bingCount + chanCount + booruCount;
   const ratios: RatioTuple = [{
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
   ratios.sort((a, b) => a.ratio - b.ratio);
   return ratios;
}

// initalize dbRatios
let dbRatios = getDbRatios();

// this runs every 5 minutes, it updates the count's for every table
// and refreshes the dbRatios
setInterval(() => {
   bingCount = countBing.get()['COUNT(*)'];
   chanCount = countChan.get()['COUNT(*)'];
   booruCount = countBooru.get()['COUNT(*)'];
   dbRatios = getDbRatios();
}, 600000);

// gets a random cat from our db
export function getRandomCat(): DiscordEmbedImageReply {
   // picks a random number between 0 and 1
   const randomSearch = Math.random();
   let reply;

   if (randomSearch < dbRatios[0].ratio) reply = dbRatios[0].source();
   if (randomSearch > dbRatios[0].ratio && randomSearch < dbRatios[1].ratio) reply = dbRatios[1].source();
   if (randomSearch > dbRatios[1].ratio) reply = dbRatios[2].source();
   return reply as DiscordEmbedImageReply;
}

// this runs when you do <bot prefix>catboy
export default async (message: Message): Promise<void> => {
   const reply = getRandomCat();
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Sends a random catboy :cat:',
   timeout: 1000,
};
