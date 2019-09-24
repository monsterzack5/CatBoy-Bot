import { db } from './db';

const selectAdmin = db.prepare('SELECT * FROM admins WHERE uid = ?');

export function checkAdmin(uid: string): boolean {
   return !!(selectAdmin.get(uid));
}
