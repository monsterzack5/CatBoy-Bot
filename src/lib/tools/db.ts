import Sqlite from 'better-sqlite3';
import { existsSync } from 'fs';
import { exportFile } from './fileLoader';

let database: Sqlite.Database;

class Database {
   private options: object = {};

   public initDb(): boolean {
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
      }
      return true;
   }

   public get(): Sqlite.Database {
      return database;
   }
}

export const db = new Database();

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
