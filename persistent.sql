CREATE TABLE IF NOT EXISTS favorites (
   uid TEXT PRIMARY KEY,
   url TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS filtered (
   id TEXT PRIMARY KEY,
   source TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS reports (
   url TEXT PRIMARY KEY,
   num INTEGER NOT NULL,
   source TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS badurls (
   url TEXT PRIMARY KEY,
   source TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS bingcats (
   id TEXT PRIMARY KEY,
   url TEXT NOT NULL,
   height INTEGER NOT NULL,
   width INTEGER NOT NULL,
   dateposted TEXT NOT NULL,
   name TEXT NOT NULL,
   color TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS boorucats (
   url TEXT PRIMARY KEY,
   source TEXT,
   height INTEGER NOT NULL,
   width INTEGER NOT NULL,
   score INTEGER NOT NULL,
   tags TEXT
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS filters (
   regex TEXT PRIMARY KEY,
   source TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS chancats (
   no INTEGER PRIMARY KEY,
   ext TEXT NOT NULL,
   height INTEGER NOT NULL,
   width INTEGER NOT NULL,
   filesize INTEGER NOT NULL,
   md5 TEXT NOT NULL,
   op INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS threads (
   no INTEGER PRIMARY KEY,
   status TEXT NOT NULL,
   lastmodified INTEGER
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS userstats (
   uid TEXT PRIMARY KEY,
   bing INTEGER DEFAULT 0 NOT NULL,
   booru INTEGER DEFAULT 0 NOT NULL,
   chan INTEGER DEFAULT 0 NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS botactions (
   url TEXT PRIMARY KEY,
   action TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS admins (
   uid TEXT PRIMARY KEY
) WITHOUT ROWID;

CREATE TRIGGER IF NOT EXISTS remove_dead_links 
   AFTER UPDATE OF status ON threads WHEN NEW.status = 'dead'
BEGIN
   DELETE FROM chancats WHERE op = OLD.no;
END;