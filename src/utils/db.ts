import Sqlite from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { exportFile } from './fileLoader';
import { bot } from './bot';

let database: Sqlite.Database;

function execScema(db: Sqlite.Database): void {
   const schema = readFileSync('./schema.sql', 'utf-8');
   db.exec(schema);
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
