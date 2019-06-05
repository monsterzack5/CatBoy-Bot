'use strict';
////////////////////////////////////////////////////////
// Feel free to edit these values directly in the script
const prefix = '!';
////////////////////////////////////////////////////////


const config = {
    game: '',
    game_state: '',
    game_url: '',
    prefix: prefix
}

let bot, fs;
try {
    require('dotenv').config();
    const Discord = require('discord.js');
    fs = require('fs');
    bot = new Discord.Client();
    bot.login(process.env.discordtoken || process.env.discordtoken_dev);
} catch (e) {
    console.log(`Error! Did you setup your .env file and run "node scripts/heroku_config"?\n${e}`);
    process.edit(1);
}

bot.on('ready', async () => {
    try {
        fs.writeFileSync(`./${process.env.config_file}.json`, JSON.stringify(config, null, 2));
        await bot.channels.get(process.env.database_channel).send({
            files: [`${process.env.config_file}.json`]
        });
        console.log('Exported the config to your db channel! The bot is ready to be run with npm run dev or npm start');
        process.exit(1);
    } catch (e) {
        console.error(`Error! failed to export config to your log channel.
        Did you setup your .env right?
        Does the bot account have write access to the discord channel?\n${e}`)
        process.exit(1);
    }
});