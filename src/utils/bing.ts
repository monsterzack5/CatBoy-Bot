import got from 'got';
import { db } from './db';
import { ReturnedBingJSON } from '../typings/interfaces';

const insertBing = db.prepare('INSERT OR REPLACE INTO bingcats (id, url, height, width, dateposted, name, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'bing\'');
const deleteBing = db.prepare('DELETE FROM bingcats WHERE id = ?');
const selectAllFilters = db.prepare('SELECT regex FROM filters');

const insertImagesRemoveFiltered = db.transaction((images: ReturnedBingJSON[], badImages): void => {
   for (const image of images) {
      insertBing
         .run(image.imageId, image.contentUrl, image.height, image.width, image.datePublished, image.name, image.accentColor);
   }
   for (const badImage of badImages) {
      deleteBing.run(badImage.id);
   }
});

// TODO: not hardcode this
const searchTerms = [{
   q: 'anime+cat+boy',
   limit: 150,
},
{
   q: 'anime+cat+boys',
   limit: 150,
},
{
   q: 'anime+neko+boy',
   limit: 150,
}];

async function getJSON(url: string): Promise<ReturnedBingJSON | void> {
   try {
      const req = await got(url, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36)',
            'Ocp-Apim-Subscription-Key': process.env.bingToken,
         },
         json: true,
      });
      return req.body;
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
async function getImages(inputJSON: ReturnedBingJSON[] = [], offset = 0, termNum = 0,
   totalItems = searchTerms[0].limit): Promise<ReturnedBingJSON[]> {
   // what's the point of eslint(no-param-reassign) ????
   let json = inputJSON;
   let term = termNum;
   let total = totalItems;

   // most searches return much less than however much you set count to
   const count = 400;
   const url = `https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${searchTerms[term].q}&count=${count}&offset=${offset}&mkt=en-us&safeSearch=Moderate`;
   const newJSON = await getJSON(url) as ReturnedBingJSON;
   await sleep(750);
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

function removeFiltered(json: ReturnedBingJSON[]): ReturnedBingJSON[] {
   const filteredWebsites = selectAllFilters.all().reduce((acc, val) => {
      acc.push(val.regex);
      return acc;
   }, []) as RegExp[];
   let goodJSON = json;
   for (const regex of filteredWebsites) {
      const { length } = goodJSON;
      const expression = new RegExp(regex, 'i');
      goodJSON = goodJSON.filter((key: ReturnedBingJSON): boolean => !(expression.test(key.contentUrl)));
      console.log(`Removed ${length - goodJSON.length} elements using the ${regex} filter`);
   }
   return goodJSON;
}

export async function updateBing(): Promise<void> {
   // wait until we get all the images we requested
   const data = await getImages();
   // remove websites we blocked with the `filters` table in the db
   const dataFiltered = removeFiltered(data);

   try {
      const badImages = searchFiltered.all();
      insertImagesRemoveFiltered(dataFiltered, badImages);
   } catch (e) {
      console.error(`Error! Failed to update the bing cats!\n${e}`);
   }
   return Promise.resolve();
}
