import { db } from '../utils/db';
import { makeImagePermalink } from '../utils/makeImagePermalink';

const getFavs = db.prepare('SELECT * FROM favorites');
const replaceFav = db.prepare('UPDATE favorites SET url = ? WHERE uid = ?');

async function main(): Promise<void> {
   const allUrls = getFavs.all();
   const betterPromises = allUrls.map((fav: Fav) => makeImagePermalink(fav.url));
   const betterArray = await Promise.all(betterPromises);
   for (let i = 0; i < betterArray.length; i += 1) {
      replaceFav.run(betterArray[i], allUrls[i].uid);
   }
}
main();

interface Fav {
   uid: string;
   url: string;
}
