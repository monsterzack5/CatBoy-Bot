CREATE TABLE IF NOT EXISTS antispam (
   rowid INTEGER PRIMARY KEY AUTOINCREMENT,
   uid TEXT NOT NULL,
   command TEXT NOT NULL,
   time INTEGER NOT NULL
);
