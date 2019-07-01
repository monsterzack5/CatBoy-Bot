import request from 'request-promise-native';
import {
   db,
   insertBing,
   deleteBingById,
   searchFiltered,
} from './db';

const insertImagesRemoveFiltered = db.transaction((images, badImages): void => {
   for (const image of images) {
      insertBing.run(image.id, image.url);
   }
   for (const badImage of badImages) {
      deleteBingById.run(badImage.id);
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

// todo: add hdwallpapers.cat
// and add db support for this
const filteredWebsites = [
   /pics.me.me/i,
   /wattpad.com/i,
   /usafdrumcorps.us/i,
];

async function getJSON(url: string): Promise<ReturnedJSON | void> {
   try {
      const req = await request({
         uri: url,
         headers: {
            'User-Agent': 'com.zhiliaoapp.musically/2019031132 (Linux; U; Android 9; en_US; Pixel 2 XL; Build/PQ2A.190305.002; Cronet/58.0.2991.0)',
            'Ocp-Apim-Subscription-Key': process.env.bingToken,
         },
         json: true,
      });
      return req;
   } catch (e) {
      return console.error(`Error Getting bing JSON:\n${e}`);
   }
}

// bing doesn't like their api spammed and will return 4XX errors
// for more than 3 calls a second (on a free plan)
async function sleep(timeMs: number): Promise<void> {
   await setTimeout(() => { }, timeMs);
}

// recursive function to use Bing's API
async function getImages(inputJSON: ReturnedJSON[] = [], offset = 0, termNum = 0,
   totalItems = searchTerms[0].limit): Promise<ReturnedJSON[]> {
   // what's the point of eslint(no-param-reassign) ????
   let json = inputJSON;
   let term = termNum;
   let total = totalItems;

   // most searches return much less than however much you set count to
   const count = 400;
   const url = `https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${searchTerms[term].q}&count=${count}&offset=${offset}&mkt=en-us&safeSearch=Moderate`;
   const newJSON = await getJSON(url) as ReturnedJSON;
   await sleep(500);
   // add the new responces to `json`
   json = json.concat(newJSON.value);

   // call this function recursively till we get the limit specified
   if (json.length < total) {
      return getImages(json, newJSON.nextOffset, term, total);
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
      return getImages(json, 0, term, total);
   }
   return json;
}

function removeFiltered(json: BingImage[]): BingImage[] {
   let goodJSON = json;
   // return console.log(`asdf: ${JSON.stringify(goodJSON, null, 2)}`);
   for (const regex of filteredWebsites) {
      const { length } = goodJSON;
      goodJSON = goodJSON.filter((key: BingImage): boolean => {
         if (key.url.match(regex)) {
            return false;
         }
         return true;
      });
      console.log(`Removed ${length - goodJSON.length} elements using the ${regex} filter`);
   }
   return goodJSON;
}

export async function updateBing(): Promise<void> {
   // wait until we get all the images we requested
   const data = await getImages();

   // remove _a lot_ of useless data
   const dataLite: BingImage[] = data.map(d => ({
      url: d.contentUrl,
      id: d.imageId,
   }));

   // filter out some blacklisted websites
   const dataFiltered: BingImage[] = removeFiltered(dataLite);

   try {
      const badImages = searchFiltered.all('bing');
      insertImagesRemoveFiltered(dataFiltered, badImages);
   } catch (e) {
      console.error(`Error! Failed to update the bing cats!\n${e}`);
   }
   return Promise.resolve();
}

interface ReturnedJSON {
   value: ReturnedJSON[];
   nextOffset: number;
   contentUrl: string;
   imageId: string;
}

interface BingImage {
   url: string;
   id: string;
}
