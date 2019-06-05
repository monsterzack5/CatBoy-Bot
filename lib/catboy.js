'use strict';

const fs = require('fs');
const booru = require('booru');
const colors = require('randomcolor');

const sfw_sites = {
   // websites with no catboy content:
   // e621.net, e926.net, hypnohub.net, yande.re rule34.xxx (all nsfw)
   // xbooru.com, lolibooru.moe, rule34.paheal.net, derpibooru.org (degenerate)
   // realbooru.com. furry.booru.org

   // gelbooru, safebooru, tbib:
   // return several results for both 'catboy' and 'cat_boy'
   // ~ should act as an OR operator, but doesnt work
   // currently we will use whatever search retuns the most images
   'danbooru.donmai.us': {
      'search': [
         'catboy', 'rating:safe'
      ]
   },
   // there's also konachan.net, which appears to be a mirror
   // and as such, won't be used
   'konachan.com': {
      'search': [
         'catboy', 'rating:safe'
      ]
   },
   'gelbooru.com': {
      'search': [
         'cat_boy', 'rating:safe'
      ]
   },
   'safebooru.org': {
      'search': [
         'cat_boy', 'rating:safe'
      ]
   }
};



module.exports.run = async (message, args, command, bot) => {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 11);
   let reply;
   console.log(`ran numb is ${randomSearch}`);

   // 0-3 for boorus
   if (randomSearch < 4) {
      console.log('doing booru search');
      reply = await booruCat(message, randomSearch);
   }
   // 4 and up for 4chan
   if (randomSearch > 3) {
      // 4chan search
      console.log('doing 4chan search');
      reply = await chanCat(message);
   }
   return message.channel.send(reply);
}

async function chanCat(message) {
   return new Promise(async (resolve) => {
      const db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));
      const randomPost = Math.floor(Math.random() * db.posts.length);
      console.log(`sending 4chan cat with url https://i.4cdn.org/cm/${db.posts[randomPost].no}${db.posts[randomPost].ext}`);
      const reply = await embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy',
       `https://i.4cdn.org/cm/${db.posts[randomPost].no}${db.posts[randomPost].ext}`);
      return resolve(reply);
   });
}

async function booruCat(message, randomNum) {
   return new Promise(async (resolve) => {
      const sites = Object.keys(sfw_sites);
      let cat, reply;
      try {
         cat = await booru.search(sites[randomNum], sfw_sites[sites[randomNum]].search, {
            limit: 1,
            random: true
         });
         reply = await embedBuilder(cat[0].source, cat[0].fileUrl);
      } catch (e) {
         console.error(`[Search]Error!
         site: ${sites[randomNum]}
         search_terms: ${sfw_sites[sites[randomNum]].search}
         ${e}`);
         return message.react('⁉');
      }
      return resolve(reply)
   });
}




async function embedBuilder(source, url) {
   return new Promise((resolve) => {
      const color = parseInt(colors.randomColor().substring(1), 16);
      let desc;

      if (source === undefined || source === '') {
         desc = '';
      } else desc = `[Source](${source})`;

      // console.log(`Site: ${site}`);
      return resolve({
         'embed': {
            'color': color,
            'description': desc,
            'image': {
               'url': url
            },
         }
      });
   });
}

module.exports.help = {
   name: 'catboy',
   help: 'Catboys make the rockin world go round'
}