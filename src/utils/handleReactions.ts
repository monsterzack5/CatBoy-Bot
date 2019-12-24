import { Message } from 'discord.js';
import { db } from './db';
import { checkAdmin } from './checkAdmin';
import { filterUrl } from './filter';
import { logger } from './logger';
import { makeImagePermalink } from './makeImagePermalink';
import { sleep } from './sleep';

const insertFavorite = db.prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');
const insertReport = db.prepare('INSERT INTO reports (url, num) VALUES (?, 1) ON CONFLICT(url) DO UPDATE SET num = num + 1');
const selectFiltered = db.prepare('SELECT * FROM filtered WHERE id = ?');

export async function handleFavorite(userID: string, url: string): Promise<void> {
   // up date the db first, so !mycatboy works right away
   // then update the db with a permalink
   insertFavorite.run(userID, url);
   const permaUrl = await makeImagePermalink(url);
   insertFavorite.run(userID, permaUrl);
}

export async function handleFilter(url: string, postToFilter: Message, userID: string): Promise<void> {
   if (!checkAdmin(userID)) return;

   // react with F if something was filtered, interobang if not
   // if filtered, delete catboy after 5 seconds
   const react = (filterUrl(url, true) ? '🇫' : '⁉');
   await postToFilter.react(react);
   if (react === '🇫') {
      await sleep(5000);
      await postToFilter.delete();
   }
}

async function reactThenRemoveIt(postToFilter: Message, reaction: string, time: number): Promise<void> {
   const react = await postToFilter.react(reaction);
   await sleep(time);
   react.remove();
}

export function handleReport(url: string, postToFilter: Message): void {
   let postNumber = '';
   if (url.startsWith('https://i.4cdn.org')) {
      postNumber = url.substring(22, 35);
   }

   const isAlreadyFiltered = (postNumber ? selectFiltered.get(postNumber) : selectFiltered.get(url));
   if (isAlreadyFiltered) {
      reactThenRemoveIt(postToFilter, '😾', 2500);
      return;
   }

   insertReport.run(url);
   reactThenRemoveIt(postToFilter, '😾', 2500);
   logger.warn(`Report received! url: \`${url}\``);
}
