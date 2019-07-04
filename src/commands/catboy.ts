import { search as booru } from 'booru';
import SearchResults from 'booru/dist/structures/SearchResults';
import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';
import { DiscordEmbedReply } from '../typings/interfaces';


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

function embedBuilder(source: string | undefined, url: string): DiscordEmbedReply {
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


async function booruCat(message: Message): Promise<DiscordEmbedReply> {
   const randomNum = Math.floor(Math.random() * sitesLen);
   let cat: SearchResults;
   let reply: DiscordEmbedReply = {};

   try {
      cat = await booru(sfwSites[randomNum].site, sfwSites[randomNum].search, {
         limit: 1,
         random: true,
      });

      // this happens sometimes, i have no idea why
      if (!cat[0].fileUrl) {
         return booruCat(message);
      }

      // check if this catboy is filtered, if so return function recursively
      const isFiltered = searchFilteredById.get(cat[0].fileUrl);
      if (isFiltered) {
         return booruCat(message);
      }

      reply = await embedBuilder(cat[0].source, cat[0].fileUrl) as DiscordEmbedReply;
   } catch (err) {
      message.react('⁉');
      console.error(err);
   }
   return reply;
}

async function chanCat(): Promise<DiscordEmbedReply> {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
   const reply = await embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
   return reply;
}

async function bingCat(): Promise<DiscordEmbedReply> {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = await embedBuilder(source, cat.url);
   return reply;
}


export default async (message: Message): Promise<void> => {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 50);
   let reply: DiscordEmbedReply = {};

   // 0-3 for boorus, 4 to 10 for 4chan, 11 and up for bing
   if (randomSearch < 10) reply = await booruCat(message);
   if (randomSearch > 9 && randomSearch < 25) reply = await chanCat();
   if (randomSearch > 24) reply = await bingCat();
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Sends a random catboy :cat:',
   timeout: 1000,
};
