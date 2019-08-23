import Sqlite from 'better-sqlite3';
import { existsSync } from 'fs';
import { exportFile } from './fileLoader';
import { bot } from './bot';

let database: Sqlite.Database;

function execScema(db: Sqlite.Database): void {
   db.exec('CREATE TABLE IF NOT EXISTS bingcats (id TEXT PRIMARY KEY, url TEXT NOT NULL, height INTEGER NOT NULL, width INTEGER NOT NULL, dateposted TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS chancats (no INTEGER PRIMARY KEY, ext TEXT NOT NULL, height INTEGER NOT NULL, width INTEGER NOT NULL, filesize INTEGER NOT NULL, md5 TEXT NOT NULL, op INTEGER NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS threads (no INTEGER PRIMARY KEY, status TEXT NOT NULL, lastmodified INTEGER) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS favorites (uid TEXT PRIMARY KEY, url TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS filtered (id TEXT PRIMARY KEY, source TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS reports (url TEXT PRIMARY KEY, num INTEGER NOT NULL, source TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS badurls (url TEXT PRIMARY KEY, source TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS boorucats (url TEXT PRIMARY KEY, source TEXT, height INTEGER NOT NULL, width INTEGER NOT NULL, score INTEGER NOT NULL, tags TEXT) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS filters (regex TEXT PRIMARY KEY, source TEXT NOT NULL)');
   db.exec('CREATE TRIGGER IF NOT EXISTS remove_dead_links AFTER UPDATE OF status ON threads WHEN NEW.status = \'dead\' BEGIN DELETE FROM chancats WHERE op = OLD.no; END');
}

class Database {
   private options: object = {};

   public db!: Sqlite.Database;

   public constructor() {
      if (!existsSync(`./${process.env.dbFile}.db`)) {
         console.error(new Error('Fatal Error: Database file not imported before init'));
         return process.exit(3);
      }
      if (process.env.NODE_ENV === 'dev') {
         this.options = { verbose: console.log };
      }
      database = new Sqlite(`./${process.env.dbFile}.db`, this.options);
      database.pragma('journal_mode = WAL');
      execScema(database);
      this.db = database;
   }
}

export const { db } = new Database();

// Although both of these emitters try to exit Node gracefully, sockets
// aren't forcibly closed, which keeps the event loop running (sometimes),
// so we still need to call process.exit(). TODO.

process.on('SIGINT', async (): Promise<void> => {
   database.close();
   await exportFile(`${process.env.dbFile}.db`);
   await bot.destroy();
   const { stopTimers } = await import('../timers');
   stopTimers();
   console.log('aught interrupt signal, exiting!');
   process.exit(0);
});

// only archive the database on sigterm
process.on('SIGTERM', async (): Promise<void> => {
   database.close();
   await exportFile(`${process.env.dbFile}.db`);
   await exportFile(`${process.env.dbFile}.db`, true);
   const { stopTimers } = await import('../timers');
   stopTimers();
   console.log('Goodbye!');
   process.exit(0);
});
