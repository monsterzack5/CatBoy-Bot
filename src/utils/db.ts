import Sqlite from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';

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
