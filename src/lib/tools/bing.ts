const request = require('request-promise-native');
const { db } = require('./helper');

const insertBing = db.prepare('INSERT OR REPLACE INTO bingcats (id, url) VALUES(?, ?)');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'bing\'');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE id = ?');

const insertImagesRemoveFiltered = db.transaction((images, badImages) => {
   for (const image of images) {
      insertBing.run(image.id, image.url);
   }
   for (const badImage of badImages) {
      deleteBing.run(badImage.id);
   }
});

const searchTerms = [{
   q: 'anime+cat+boy',
   limit: 280,
},
{
   q: 'anime+cat+boys',
   limit: 280,
},
{
   q: 'anime+neko+boy',
   limit: 280,
}];

const filteredWebsites = [
   /pics.me.me/i,
   /wattpad.com/i,
   /usafdrumcorps.us/i,
];

function getJSON(url) {
   return new Promise((resolve, reject) => {
      request({
         uri: url,
         headers: {
            'User-Agent': 'com.zhiliaoapp.musically/2019031132 (Linux; U; Android 9; en_US; Pixel 2 XL; Build/PQ2A.190305.002; Cronet/58.0.2991.0)',
            'Ocp-Apim-Subscription-Key': process.env.bingtoken,
         },
         json: true,
      })
         .then(data => resolve(data))
         .catch(err => reject(err));
   });
}

// bing doesn't like their api spammed and will return 4XX errors
// for more than 3 calls a second (on a free plan)
function sleep(timeMs) {
   return new Promise(resolve => setTimeout(resolve, timeMs));
}

// recursive function to use Bing's API
function getImages(inputJSON = [], offset = 0, termNum = 0, totalItems = searchTerms[0].limit) {
   return new Promise(async (resolve) => {
      // what's the point of eslint(no-param-reassign) ????
      let json = inputJSON;
      let term = termNum;
      let total = totalItems;

      // most searches return much less than however much you set count to
      const count = 400;
      const newJSON = await getJSON(`https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${searchTerms[term].q}&count=${count}&offset=${offset}&mkt=en-us&safeSearch=Moderate`);
      await sleep(500);
      // add the new responces to `json`
      json = json.concat(newJSON.value);

      // call this function recursively till we get the limit specified
      if (json.length < total) {
         return resolve(getImages(json, newJSON.nextOffset, term, total));
      }
      // sometimes bing likes to give us like 100 images over the total we want
      json = json.slice(0, total);

      // if we have more than 280 images, and we're on a term thats not the last one
      // we call the function again, increasing the term we're on
      // we use searchTerms[term + 1] to check if the next term is going to be undefined
      // and skip the if it is
      if (term < searchTerms.length && searchTerms[term + 1]) {
         term += 1;
         total += searchTerms[term].limit;
         // we set the offset back to 0 when switching to the next term.
         return resolve(getImages(json, 0, term, total));
      }
      return resolve(json);
   });
}

function removeFiltered(json) {
   let goodJSON = json;
   for (const regex of filteredWebsites) {
      const { length } = goodJSON;
      goodJSON = goodJSON.filter((key) => {
         if (key.url.match(regex)) {
            return false;
         }
         return true;
      });
      console.log(`Removed ${length - goodJSON.length} elements using the ${regex} filter`);
   }
   return goodJSON;
}

async function update() {
   // wait until we get all the images we requested
   let data = await getImages();

   // remove _a lot_ of useless data
   data = data.map(d => ({
      url: d.contentUrl,
      id: d.imageId,
   }));

   // filter out some blacklisted websites
   data = removeFiltered(data);

   try {
      const badImages = searchFiltered.all();
      insertImagesRemoveFiltered(data, badImages);
   } catch (e) {
      console.error(`Error! Failed to update the bing cats!\n${e}`);
   }
}

module.exports = {
   update,
};
