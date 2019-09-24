import Sqlite from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';

function execScema(db: Sqlite.Database, schemaFile: string): void {
   if (existsSync(schemaFile)) {
      const schema = readFileSync(schemaFile, 'utf-8');
      db.exec(schema);
   } else {
      throw new Error('Database schema file not found!');
   }
}

class Database {
   private options: object = {};

   public db!: Sqlite.Database;

   public memDb!: Sqlite.Database;

   public constructor() {
      if (!existsSync(`./${process.env.dbFile}.db`)) {
         console.error(new Error('Fatal Error: Database file not imported before init'));
         return process.exit(3);
      }
      if (process.env.NODE_ENV === 'dev') {
         this.options = { verbose: console.log };
      }
      this.db = new Sqlite(`./${process.env.dbFile}.db`, this.options);
      this.memDb = new Sqlite(':memory:', this.options);
      this.db.pragma('journal_mode = WAL');
      execScema(this.db, './persistent.sql');
      execScema(this.memDb, './temporary.sql');
   }
}

export const { db, memDb } = new Database();
