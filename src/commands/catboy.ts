import { search as booru } from 'booru';
import SearchResults from 'booru/dist/structures/SearchResults';
import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';
import { DiscordEmbedImageReply } from '../typings/interfaces';


// these statements get the length of the DB
const bCount = db.prepare('SELECT COUNT(*) FROM bingcats');
const cCount = db.prepare('SELECT COUNT(*) FROM chancats');

// these statements take a random number, and use it as the offset
// to select a random cat
const searchBing = db.prepare('SELECT * FROM bingcats LIMIT 1 OFFSET ?');
const searchChan = db.prepare('SELECT * FROM chancats LIMIT 1 OFFSET ?');

// these vars hold the total items of both tables
let bingCount = bCount.get()['COUNT(*)'];
let chanCount = cCount.get()['COUNT(*)'];

// this searches the DB for filtered booru cats
const searchFilteredById = db.prepare('SELECT * FROM filtered WHERE id = ?');

// update vars that hold the total items of the tables every 5 minutes
setInterval(() => {
   bingCount = bCount.get()['COUNT(*)'];
   chanCount = cCount.get()['COUNT(*)'];
}, 600000);

const sfwSites = [
   {
      site: 'danbooru.donmai.us',
      search: [
         'catboy', 'rating:safe',
      ],
   },
   {
      site: 'konachan.com',
      search: [
         'catboy', 'rating:safe',
      ],
   },
   {
      site: 'gelbooru.com',
      search: [
         'cat_boy', 'rating:safe',
      ],
   },
   {
      site: 'safebooru.org',
      search: [
         'cat_boy', 'rating:safe',
      ],
   },
];
const sitesLen = sfwSites.length;

function embedBuilder(source: string | undefined, url: string): DiscordEmbedImageReply {
   const color = parseInt((randomColor() as string).substring(1), 16);
   let description: string;

   if (source === undefined || source === '') {
      description = '';
   } else description = `[Source](${source})`;

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


async function booruCat(): Promise<DiscordEmbedImageReply | void> {
   const randomNum = Math.floor(Math.random() * sitesLen);
   let cat: SearchResults;

   try {
      cat = await booru(sfwSites[randomNum].site, sfwSites[randomNum].search, {
         limit: 1,
         random: true,
      });
   } catch (err) {
      return console.error(err);
   }
   // this happens sometimes, i have no idea why
   if (!cat[0].fileUrl) {
      return booruCat();
   }

   // check if this catboy is filtered, if so return function recursively
   const isFiltered = searchFilteredById.get(cat[0].fileUrl);
   if (isFiltered) {
      return booruCat();
   }

   const reply = embedBuilder(cat[0].source, cat[0].fileUrl);

   return reply as DiscordEmbedImageReply;
}

function chanCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
   const reply = embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
   return reply;
}

function bingCat(): DiscordEmbedImageReply {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = embedBuilder(source, cat.url);
   return reply;
}

export async function getRandomCat(): Promise<DiscordEmbedImageReply> {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 50);
   let reply;

   // 0-3 for boorus, 4 to 10 for 4chan, 11 and up for bing
   if (randomSearch < 10) reply = await booruCat() as DiscordEmbedImageReply;
   if (randomSearch > 9 && randomSearch < 25) reply = chanCat();
   if (randomSearch > 24) reply = bingCat();
   return reply as DiscordEmbedImageReply;
}

export default async (message: Message): Promise<void> => {
   const reply = await getRandomCat();
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Sends a random catboy :cat:',
   timeout: 1000,
};
