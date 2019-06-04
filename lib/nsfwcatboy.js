'use strict';

const fs = require('fs');
const booru = require('booru');

const nsfw_sites = {
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
         'catboy', 'rating:explicit'
      ]
   },
   // there's also konachan.net, which appears to be a mirror
   // and as such, won't be used
   'konachan.com': {
      'search': [
         'catboy', 'rating:explicit'
      ]
   },
   'gelbooru.com': {
      'search': [
         'cat_boy', 'rating:explicit'
      ]
   },
   // 'safebooru.org': {
   //    'search': [
   //       'cat_boy', 'rating:explicit'
   //    ]
   // },
   'furry.booru.org': {
      'search': [
         'catboy', 'rating:explicit'
      ]
   }
};



module.exports.run = async (message, args, command, bot) => {
   /*
      if (message.author.id !== '185513703364362240') {
         return message.channel.send(`You've waited your whole life for catboys, can you please wait just a few more minutes?`);
      }
   */
   const sites = Object.keys(nsfw_sites);
   let randomNum = Math.floor(Math.random() * 5);
   // console.log(`
   // Good Site: ${Object.keys(sfw_sites)[randomNum]}
   // Good Tags: ${true}
   // `)


   // console.log(`
   // Bad Site: ${JSON.stringify(sites[randomNum], null, 2)}
   // Bad Tags: ${sfw_sites[sites[randomNum]].search} 
   // and tags are: {}
   //  `);
   // const cat = await booru.search('gelbooru', ['cat_boy', 'score:>=8', 'rating:explicit'], {
   console.log(`nsfw: ${sites[randomNum]}`);
   const cat = await booru.search(sites[randomNum], nsfw_sites[sites[randomNum]].search, {
      limit: 1,
      random: true
   });
   let reply;
   try {
      reply = await embedBuilder(cat[0].source, cat[0].fileUrl);
   } catch (err) {
      console.log(`(NSFW): Error! with site: ${sites[randomNum]}`);
      fs.writeFileSync('./testnsfw.json', JSON.stringify(cat, null, 2));
      reply = await embedBuilder(undefined, cat[0].fileUrl);
   }
   return message.channel.send(reply);
}

async function embedBuilder(site, url) {
   return new Promise((resolve) => {
      const color = parseInt(require('randomcolor').randomColor().substring(1), 16);
      let desc;

      if (site === undefined || site === '') {
         desc = ''
      } else desc = `[Source](${site})`

      console.log(`Site: ${site}`);
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
   name: 'nsfwcatboy',
   help: 'Catboys make the rockin world go round'
}