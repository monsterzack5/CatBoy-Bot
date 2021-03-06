import { search as booru } from 'booru';
import SearchResults from 'booru/dist/structures/SearchResults';
import { db } from './db';
import { logger } from './logger';

const insertBooru = db.prepare('INSERT OR REPLACE INTO boorucats (url, source, height, width, score, tags) VALUES (?, ?, ?, ?, ?, ?)');
const selectBooru = db.prepare('SELECT * FROM boorucats WHERE url = ?');
const searchFiltered = db.prepare('SELECT * FROM filtered WHERE source = \'booru\'');
const deleteBooru = db.prepare('DELETE FROM boorucats WHERE url = ?');

const insertImagesRemoveFiltered = db.transaction((booruCats, badCats): void => {
   let totalAdded = 0;
   for (const cat of booruCats) {
      // sometimes cats also have a `cat.data.source` url, which isnt null
      // but if fileUrl is null, that url always leads to a 403
      if (cat.fileUrl) {
         const alreadyInDb = selectBooru.get(cat.fileUrl);
         if (!alreadyInDb) {
            insertBooru.run(cat.fileUrl, cat.source, cat.height, cat.width, cat.score, cat.tags.join(' '));
            totalAdded += 1;
         }
      }
   }
   for (const badCat of badCats) {
      const didDelete = deleteBooru.run(badCat.id);
      if (didDelete.changes > 0) {
         totalAdded -= 1;
      }
   }
   if (totalAdded > 0) {
      logger.log(`Pulled in ${totalAdded} images from boorus into our db`);
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
      logger.error('updateBooru::booru', e);
   }
   return Promise.resolve();
}
