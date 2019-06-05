'use strict';

const fs = require('fs');
const booru = require('booru');
const colors = require('randomcolor');

const sfw_sites = {
   // websites with no catboy content:
   // e621.net, e926.net, hypnohub.net, yande.re rule34.xxx (all nsfw)
   // xbooru.com, lolibooru.moe, rule34.paheal.net, derpibooru.org (degenerate)
   // realbooru.com

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
   //'furry.booru.org': {
     // 'search': [
     //    'catboy', 'rating:safe'
     // ]
   //}
};



module.exports.run = async (message, args, command, bot) => {
   /*
      if (message.author.id !== '185513703364362240') {
         return message.channel.send(`You've waited your whole life for catboys, can you please wait just a few more minutes?`);
      }
   */
   const sites = Object.keys(sfw_sites);
   let randomNum = Math.floor(Math.random() * 4);
   let cat, reply;
   try {
       cat = await booru.search(sites[randomNum], sfw_sites[sites[randomNum]].search, {
         limit: 1,
         random: true
      });
    reply = await embedBuilder(cat[0].source, cat[0].fileUrl);
   } catch(e) {
      console.error(`[Search]Error!
      site: ${sites[randomNum]}
      search_terms: ${sfw_sites[sites[randomNum]].search}
      ${e}`);
      return message.react('⁉');
   }
   return message.channel.send(reply);
}

async function embedBuilder(site, url) {
   return new Promise((resolve) => {
      const color = parseInt(colors.randomColor().substring(1), 16);
      let desc;

      if (site === undefined || site === '') {
         desc = ''
      } else desc = `[Source](${site})`

      // console.log(`Site: ${site}`);
      return resolve({
         'embed': {
            'color': color,
            'description': desc,
            'image': {
               'url': url
            },
            // "footer": {
            //    "text": `[Source](https://google.com)`
            // }
         }
      });
   });
}

module.exports.help = {
   name: 'catboy',
   help: 'Catboys make the rockin world go round'
}