import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';
import { getDbRatios } from '../utils/ratios';
import { DiscordEmbedImageReply } from '../typings/interfaces';

// these statements take a random number, and use it as the offset
// to select a random cat
const searchBing = db.prepare('SELECT * FROM bingcats LIMIT 1 OFFSET ?');
const searchChan = db.prepare('SELECT * FROM chancats LIMIT 1 OFFSET ?');
const searchBooru = db.prepare('SELECT * FROM boorucats LIMIT 1 OFFSET ?');

// set dbRatios, all count variables on boot
let {
   dbRatios, bingCount, chanCount, booruCount,
} = getDbRatios();

// expose a function to update ratios
export function updateRatios(): void {
   ({
      dbRatios, bingCount, chanCount, booruCount,
   } = getDbRatios());
}

// runs every 5 minutes, updates the ratios
setInterval(() => {
   updateRatios();
}, 600000);

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
export function bingCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = embedBuilder(source, cat.url);
   return reply;
}

// return a cat from 4chan
export function chanCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
   const reply = embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
   return reply;
}

// return a cat from the booru's
export function booruCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * booruCount);
   const cat = searchBooru.get(random);
   const reply = embedBuilder(cat.source, cat.url);
   return reply;
}


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

// this runs when you do !catboy
export default async (message: Message): Promise<void> => {
   const reply = getRandomCat();
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Sends a random catboy :cat:',
   timeout: 1000,
};
