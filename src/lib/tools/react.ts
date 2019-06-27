import { db } from './db';

const insert = db.get().prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');

export function handleReact(userID: string, url: string): void {
   insert.run(userID, url);
}
