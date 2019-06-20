const fs = require('fs');
const request = require('request-promise-native');
const fileLoader = require('./fileLoader');
const { bot } = require('./helper');

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
function getImages(json = [], offset = 0, term = 0, total = searchTerms[0].limit) {
   return new Promise(async (resolve) => {
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

function removeDuplicates(json) {
   // so we're gonna remove the dupes from an array of objects
   // where each object HAS a id prop thats ALWAYS 40 chars

   // i think the best way to do this would be to sort the array
   // then iterate over it, checking if the last index is the
   // same as the current one.

   json = json.sort((a, b) => {
      let index = -1;
      do {
         index += 1;
         if (a.id.charCodeAt(index) > b.id.charCodeAt(index)) {
            return 1;
         }
         if (a.id.charCodeAt(index) < b.id.charCodeAt(index)) {
            return -1;
         }
         if (index > 39) {
            return 0;
         }
      } while (a.id.charCodeAt(index) === b.id.charCodeAt(index));
      // this is (probably) unreachable, but we put this here to make eslint happy
      return 0;
   });

   json = json.filter((key, index, arr) => {
      if (index === 0) {
         return true;
      }
      if (key.id !== arr[index - 1].id) {
         return true;
      }
      // console.log(`Key1: ${key.id} is the same as Key2: ${arr[index - 1].id}`);
      return false;
   });
   return json;
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
   const dataNoDuplicates = removeDuplicates(data);
   console.log(`Pulled in ${data.length} lines, or ${dataNoDuplicates.length} after duplicates are removed.`);
   const filteredData = removeFiltered(dataNoDuplicates);
   console.log(`${filteredData.length} is the total after removing filtered.`);
   const db = JSON.parse(fs.readFileSync(`./${process.env.db_file}.json`));
   db.images = filteredData;
   fs.writeFileSync(`./${process.env.db_file}.json`, JSON.stringify(db, null, 2));
   fileLoader.exportFile(`${process.env.db_file}.json`);
}

module.exports = {
   update,
};
