const booru = require('booru');
const colors = require('randomcolor');

const { db } = require('./tools/helper');

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

// update vars that hold the total items of the tables every 5 minutes
setInterval(() => {
   console.log('updating count in db');
   bingCount = bCount.get()['COUNT(*)'];
   chanCount = cCount.get()['COUNT(*)'];
}, 600000);

const sfwSites = {
   // websites with no catboy content:
   // e621.net, e926.net, hypnohub.net, yande.re rule34.xxx (all nsfw)
   // xbooru.com, lolibooru.moe, rule34.paheal.net, derpibooru.org (degenerate)
   // realbooru.com. furry.booru.org

   // gelbooru, safebooru, tbib:
   // return several results for both 'catboy' and 'cat_boy'
   // ~ should act as an OR operator, but doesnt work
   // currently we will use whatever search retuns the most images
   'danbooru.donmai.us': {
      search: [
         'catboy', 'rating:safe',
      ],
   },
   // there's also konachan.net, which appears to be a mirror
   // and as such, won't be used
   'konachan.com': {
      search: [
         'catboy', 'rating:safe',
      ],
   },
   'gelbooru.com': {
      search: [
         'cat_boy', 'rating:safe',
      ],
   },
   'safebooru.org': {
      search: [
         'cat_boy', 'rating:safe',
      ],
   },
};
const sites = Object.keys(sfwSites);
const sitesLen = sites.length;

function embedBuilder(source, url) {
   return new Promise((resolve) => {
      const color = parseInt(colors.randomColor().substring(1), 16);
      let desc;

      if (source === undefined || source === '') {
         desc = '';
      } else desc = `[Source](${source})`;
      return resolve({
         embed: {
            color,
            description: desc,
            image: {
               url,
            },
         },
      });
   });
}

function booruCat(message) {
   return new Promise(async (resolve) => {
      const randomNum = Math.floor(Math.random() * sitesLen);
      let cat;
      let reply;

      try {
         cat = await booru.search(sites[randomNum], sfwSites[sites[randomNum]].search, {
            limit: 1,
            random: true,
         });
         reply = await embedBuilder(cat[0].source, cat[0].fileUrl);
      } catch (e) {
         console.error(`[Search]Error!
         site: ${sites[randomNum]}
         search_terms: ${sfwSites[sites[randomNum]].search}
         ${e}`);
         return message.react('⁉');
      }
      return resolve(reply);
   });
}

function chanCat() {
   return new Promise(async (resolve) => {
      const random = Math.floor(Math.random() * chanCount);
      const cat = searchChan.get(random);
      const url = `https://i.4cdn.org/cm/${cat.no}${cat.ext}`;
      const reply = await embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy', url);
      return resolve(reply);
   });
}

function bingCat() {
   return new Promise(async (resolve) => {
      const random = Math.floor(Math.random() * bingCount);
      const cat = searchBing.get(random);
      const source = `https://www.bing.com/images/search?view=detailv2&id=${cat.id}`;
      const reply = await embedBuilder(source, cat.url);
      return resolve(reply);
   });
}


module.exports.run = async (message) => {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 55);
   let reply;

   // 0-3 for boorus, 4 to 10 for 4chan, 11 and up for bing
   if (randomSearch < 4) reply = await booruCat(message);
   if (randomSearch > 3 && randomSearch < 11) reply = await chanCat();
   if (randomSearch > 10) reply = await bingCat();
   return message.channel.send(reply);
};

module.exports.help = {
   name: 'catboy',
   help: 'Catboys make the rockin world go round',
};
