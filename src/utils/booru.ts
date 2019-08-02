import { search as booru } from 'booru';
import SearchResults from 'booru/dist/structures/SearchResults';
import { db } from './db';

const insertBooru = db.prepare('INSERT OR REPLACE INTO boorucats (url, source, height, width, score, tags) VALUES (?, ?, ?, ?, ?, ?)');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'booru\'');
const deleteBooru = db.prepare('DELETE FROM boorucats WHERE url = ?');

const insertImagesRemoveFiltered = db.transaction((booruCats, badCats): void => {
   for (const cat of booruCats) {
      const tagsString = cat.tags.join(' ');
      // sometimes cats also have a `cat.data.source` url, which isnt null
      // but if fileUrl is null, that url always leads to a 403
      if (cat.fileUrl) {
         insertBooru.run(cat.fileUrl, cat.source, cat.height, cat.width, cat.score, tagsString);
      }
   }
   for (const badCat of badCats) {
      deleteBooru.run(badCat.id);
   }
});

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

export async function updateBooru(): Promise<void> {
   const searchPromises: Promise<SearchResults>[] = [];
   for (const site of sfwSites) {
      searchPromises.push(booru(site.site, site.search, {
         // using 'Infinity' here breaks danbooru for some weird reason
         limit: 1200,
      }));
   }
   const allResults = await Promise.all(searchPromises);
   try {
      const allFiltered = searchFiltered.all();
      insertImagesRemoveFiltered(allResults.flat(), allFiltered);
   } catch (e) {
      console.error(`Error! Failed to update the booru cats!\n${e}`);
   }
   return Promise.resolve();
}
