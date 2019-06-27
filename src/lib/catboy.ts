import { search as booru } from 'booru';
import SearchResults from 'booru/dist/structures/SearchResults';
import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from './tools/db';


// these statements get the length of the DB
const bCount = db.get().prepare('SELECT COUNT(*) FROM bingcats');
const cCount = db.get().prepare('SELECT COUNT(*) FROM chancats');

// these statements take a random number, and use it as the offset
// to select a random cat
const searchBing = db.get().prepare('SELECT * FROM bingcats LIMIT 1 OFFSET ?');
const searchChan = db.get().prepare('SELECT * FROM chancats LIMIT 1 OFFSET ?');

// these vars hold the total items of both tables
let bingCount = bCount.get()['COUNT(*)'];
let chanCount = cCount.get()['COUNT(*)'];

// update vars that hold the total items of the tables every 5 minutes
setInterval(() => {
   console.log('updating count in db');
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

function embedBuilder(source: string | undefined, url: string): Reply {
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


async function booruCat(message: Message): Promise<Reply> {
   const randomNum = Math.floor(Math.random() * sitesLen);
   let cat: SearchResults;
   let reply: Reply = {};

   try {
      cat = await booru(sfwSites[randomNum].site, sfwSites[randomNum].search, {
         limit: 1,
         random: true,
      });
      if (!cat[0].fileUrl) {
         throw new Error('Booru cat returned undefined fileUrl');
      }
      reply = await embedBuilder(cat[0].source, cat[0].fileUrl) as Reply;
   } catch (err) {
      message.react('⁉');
      console.error(err);
   }
   return reply;
}

async function chanCat(): Promise<Reply> {
   const random = Math.floor(Math.random() * chanCount);
   const cat = searchChan.get(random);
   const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
   const reply = await embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
   return reply;
}

async function bingCat(): Promise<Reply> {
   const random = Math.floor(Math.random() * bingCount);
   const cat = searchBing.get(random);
   const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
   const reply = await embedBuilder(source, cat.url);
   return reply;
}


export default async (message: Message): Promise<void> => {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 55);
   let reply: Reply = {};

   // 0-3 for boorus, 4 to 10 for 4chan, 11 and up for bing
   if (randomSearch < 4) reply = await booruCat(message);
   if (randomSearch > 3 && randomSearch < 11) reply = await chanCat();
   if (randomSearch > 10) reply = await bingCat();
   message.channel.send(reply);
};

export const help = {
   name: 'catboy',
   help: 'Catboys make the rockin world go round',
};

interface Reply {
   embed?: {
      color: number;
      description: string;
      image: {
         url: string;
      };
   };
}
