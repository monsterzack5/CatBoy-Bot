import Sqlite from 'better-sqlite3';
import { existsSync } from 'fs';
import { exportFile } from './fileLoader';

let database: Sqlite.Database;

class Database {
   private options: Sqlite.Options = {};

   public db!: Sqlite.Database;

   public insertFav!: Sqlite.Statement;

   public insertFilter!: Sqlite.Statement;

   public insertChan!: Sqlite.Statement;

   public insertBing!: Sqlite.Statement;

   public insertReport!: Sqlite.Statement;

   public insertThread!: Sqlite.Statement;

   public searchBingByUrl!: Sqlite.Statement;

   public searchBingById!: Sqlite.Statement;

   public searchChanByNo!: Sqlite.Statement;

   public searchReportsByUrl!: Sqlite.Statement;

   public searchFilteredBySource!: Sqlite.Statement;

   public searchFilteredById!: Sqlite.Statement;

   public searchFavorite!: Sqlite.Statement;

   public searchThreads!: Sqlite.Statement;

   public deleteChanByNo!: Sqlite.Statement;

   public deleteBingById!: Sqlite.Statement;

   public constructor() {
      if (!existsSync(`./${process.env.dbFile}.db`)) {
         console.error(new Error('Fatal Error: Database file not imported before init'));
         return process.exit(3);
      }
      if (!database) {
         if (process.env.NODE_ENV === 'dev') {
            this.options = { verbose: console.log };
         }
         database = new Sqlite(`./${process.env.dbFile}.db`, this.options);
         database.pragma('journal_mode = WAL');

         this.db = database;
         this.insertFav = database.prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');
         this.insertFilter = database.prepare('INSERT INTO filtered (id, source) VALUES (?, ?)');
         this.insertReport = database.prepare('INSERT OR REPLACE INTO reports (url, num, source) VALUES (?, ?, ?)');
         this.insertChan = database.prepare('INSERT OR REPLACE INTO chancats (no, ext) VALUES (?, ?)');
         this.insertBing = database.prepare('INSERT OR REPLACE INTO bingcats (id, url) VALUES (?, ?)');
         this.insertThread = database.prepare('INSERT OR REPLACE INTO threads (id, no) VALUES (?, ?)');
         this.searchBingByUrl = database.prepare('SELECT * FROM bingcats WHERE url = ?');
         this.searchBingById = database.prepare('SELECT * FROM bingcats WHERE id = ?');
         this.searchChanByNo = database.prepare('SELECT * FROM chancats WHERE no = ?');
         this.searchReportsByUrl = database.prepare('SELECT * FROM reports WHERE url = ?');
         this.searchFilteredBySource = database.prepare('SELECT * FROM filtered WHERE source = ?');
         this.searchFilteredById = database.prepare('SELECT * FROM filtered WHERE id = ?');
         this.searchFavorite = database.prepare('SELECT url FROM favorites WHERE uid = ?');
         this.searchThreads = database.prepare('SELECT * FROM threads');
         this.deleteChanByNo = database.prepare('DELETE FROM chancats WHERE no = ?');
         this.deleteBingById = database.prepare('DELETE FROM bingcats WHERE id = ?');
      }
   }
}

export const {
   db,
   insertFav,
   insertFilter,
   insertReport,
   insertChan,
   insertBing,
   insertThread,
   searchBingByUrl,
   searchBingById,
   searchChanByNo,
   searchReportsByUrl,
   searchFilteredBySource,
   searchFilteredById,
   searchFavorite,
   searchThreads,
   deleteChanByNo,
   deleteBingById,
} = new Database();

process.on('SIGINT', async (): Promise<void> => {
   database.close();
   await exportFile(`${process.env.dbFile}.db`);
   console.log('aught interrupt signal, exiting!');
   process.exit(0);
});

// only archive the database on sigterm
process.on('SIGTERM', async (): Promise<void> => {
   database.close();
   await exportFile(`${process.env.dbFile}.db`);
   await exportFile(`${process.env.dbFile}.db`, true);
   console.log('Goodbye!');
   process.exit(0);
});
