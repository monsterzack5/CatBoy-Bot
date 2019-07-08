import Discord, { TextChannel } from 'discord.js';
import { writeFileSync } from 'fs';
import Sqlite from 'better-sqlite3';

// //////////////////////////////////////////////////////
// Feel free to edit these values directly in the script
// prefix is the prefix of the devbot
const prefix = '+';
// //////////////////////////////////////////////////////

const mainbot = new Discord.Client();
mainbot.login(process.env.discordToken);

function initDb(): void {
   const db = new Sqlite(`./${process.env.dbFile}.db`, { verbose: console.log });
   db.exec('CREATE TABLE IF NOT EXISTS bingcats (id TEXT PRIMARY KEY, url TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS chancats (no TEXT PRIMARY KEY, ext TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS favorites (uid TEXT PRIMARY KEY, url TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS filtered (id TEXT PRIMARY KEY, source TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS threads (id INTEGER PRIMARY KEY, no TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS reports (url TEXT PRIMARY KEY, num INTEGER NOT NULL, source TEXT NOT NULL) WITHOUT ROWID');
   db.exec('CREATE TABLE IF NOT EXISTS badurls (url TEXT PRIMARY KEY, source TEXT NOT NULL) WITHOUT ROWID');
   db.close();
}
initDb();

mainbot.on('ready', async () => {
   const config = {
      game: '',
      gameState: '',
      gameUrl: '',
      prefix,
   };
   try {
      writeFileSync(`./${process.env.configFile}.json`, JSON.stringify(config));
      const dbChan = await mainbot.channels.get((process.env.dbChannel as string)) as TextChannel;
      await dbChan.send({
         files: [`${process.env.configFile}.json`, `${process.env.dbFile}.db`],
      });
      console.log('Exported the config to your db channel! The bot is ready to be run with npm start\n DONT FORGET TO RUN `!config updatebing` AND `!config update4chan` immediately after boot!');
      process.exit(0);
   } catch (e) {
      console.error(`Error! failed to export config to your log channel.
        Did you setup your .env right?
        Does the bot account have write access to the discord channel?\n${e}`);
      process.exit(1);
   }
});
