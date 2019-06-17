const fs = require('fs');
const booru = require('booru');
const colors = require('randomcolor');

let db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));
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

// watch for any changes to the db, update if a change occurs
fs.watch(`./${process.env.db_file}.json`, () => {
   if (process.uptime() > 5) {
      console.log('Updating DB!');
      setTimeout(() => {
         db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`, 'utf8'));
      }, 2000);
   }
});


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

function booruCat(message, randomNum) {
   return new Promise(async (resolve) => {
      const sites = Object.keys(sfwSites);
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
      const randomPost = Math.floor(Math.random() * db.posts.length);
      const reply = await embedBuilder('https://boards.4channel.org/cm/catalog#s=catboy',
         `https://i.4cdn.org/cm/${db.posts[randomPost].no}${db.posts[randomPost].ext}`);
      return resolve(reply);
   });
}

function bingCat() {
   return new Promise(async (resolve) => {
      const random = Math.floor(Math.random() * db.images.length);
      const source = `https://www.bing.com/images/search?view=detailv2&id=${db.images[random].id}`;
      const reply = await embedBuilder(source, db.images[random].url);
      return resolve(reply);
   });
}


module.exports.run = async (message) => {
   // picks a random number between 0 and X-1
   const randomSearch = Math.floor(Math.random() * 55);
   let reply;

   // 0-3 for boorus
   if (randomSearch < 4) {
      console.log('doing booru search');
      reply = await booruCat(message, randomSearch);
   }
   // 4 to 10 for 4chan
   if (randomSearch > 3 && randomSearch < 11) {
      // 4chan search
      console.log('doing 4chan search');
      reply = await chanCat(message);
   }
   //  11 and up for bing
   if (randomSearch > 10) {
      console.log('sending bing cat');
      reply = await bingCat();
   }
   return message.channel.send(reply);
};

module.exports.help = {
   name: 'catboy',
   help: 'Catboys make the rockin world go round',
};
