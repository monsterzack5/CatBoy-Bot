// in this file, we should do the very bare minimum to download our db.
import { readFileSync } from 'fs';
import { importFile } from './utils/fileLoader';
import { bot } from './utils/bot';
import { checkRequired } from './utils/required';
import { ConfigOptions } from './typings/interfaces';

// make sure env vars are set!
if (!checkRequired()) throw new Error('Error! Enviorment Variables not set!');

// do different things in dev vs prod mode
if (process.env.NODE_ENV === 'dev') {
   // use a different config options for dev mode
   process.env.configFile = process.env.configFileDev;
   process.env.dbFile = process.env.dbFileDev;
   bot.login(process.env.discordTokenDev);
} else if (process.env.NODE_ENV === 'production') {
   bot.login(process.env.discordToken);
} else {
   console.error('Error! NODE_ENV not defined! Try running this bot with \'npm run start or npm run dev\'');
   process.exit(1);
}

// when discord says its ready, we import our db and config, and then load the commands
bot.once('ready', async (): Promise<void> => {
   console.log('Discord Client ready!');

   // this is to load Various files on boot and set runtime vars
   try {
      await importFile(`${process.env.configFile}.json`);
      await importFile(`${process.env.dbFile}.db`);
   } catch (error) {
      console.error(new Error('Error! Error importing (mandatory) boot files!'));
      process.exit(1);
   }

   // read the config and set the prefix
   const config: ConfigOptions = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());
   process.env.prefix = config.prefix;

   // set the game on boot
   if (config.gameUrl === '') {
      bot.user.setActivity(config.game, { type: config.gameState });
   } else bot.user.setActivity(config.game, { type: config.gameState, url: config.gameUrl });

   // now that we have downloaded our db, can can lazyload our commands
   const { loadCommandFiles } = await import('./utils/commandhandler');
   await loadCommandFiles();

   // once our commands are loaded, we can start our messageHandler and our timers
   await import('./messageHandler');
});
