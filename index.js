'use strict';
const Discord = require('discord.js');
const bot = new Discord.Client();

const fs = require('fs');
const request = require('request-promise-native');
const fileLoader = require('./lib/tools/fileLoader');
const spam = require('./lib/tools/antispam.')

const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 5010;

app.use(express.static(__dirname + '/public'));
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname + '/views/index.html'));
});

app.listen(port, () => {
    console.log(`Program Starting in a ${process.env.NODE_ENV} environment`);
});

bot.commands = new Discord.Collection;
fs.readdir('./lib/', (err, files) => {
    if (err) console.error(err);
    // this line only selects .js files, and adds them to command_files
    let command_files = files.filter(f => f.includes('.js'));
    for (let cmd of command_files) {
        let props = require(`./lib/${cmd}`);
        try {
            bot.commands.set(props.help.name, props);
        } catch (error) {
            console.log(`Error adding commands, file doesnt have name or help properties`);
            process.exit(1);
        }
    }
});

bot.on('ready', async () => {
    console.log('Discord Client ready!');
    // this is to load Various files on boot and set runtime vars

    try {
        await fileLoader.importFile(bot, `${process.env.config_file}.json`);
    } catch (error) {
        console.log(`Error! Error importing (mandatory) boot files! \n${error}`);
        process.exit(1);
    }
    let config = JSON.parse(fs.readFileSync(`./${process.env.config_file}.json`));

    //bot.prefix = config.prefix;
    //bot.unknown_command_message = config.unknown_command_message;
    //bot.owner_id = config.bot_owner;
    bot.user.setActivity(config.game, {
        url: config.game_url,
        type: config.game_state
    });
});

bot.on('message', async (message) => {
    if (message.author.bot === true) return;
    if (message.channel.type !== 'text' &&
        message.author.id !== process.env.bot_owner) {
        return message.channel.send('Zach said im not allowed to dm people :cry:');
    }

    let messageArguments = message.content.slice(bot.prefix.length).split(' ');
    messageArguments.shift();
    let command = message.content.slice(bot.prefix.length).split(' ').shift();
    let cmdfunction = bot.commands.get(command);

    if (message.content.startsWith(bot.prefix)) {
        if (cmdfunction) {
            let isSpam = await spam.checkAntiSpam(message, command);
            if (isSpam) return message.react('⏲');
            cmdfunction.run(message, messageArguments, command, bot);
        } else if (process.env.unknown_command_message == 'true') {
            message.channel.send('Unknown command!')
        }
    } else if (command == 'prefix') {
        // this works because when checking for a function
        // the first letter is removed, meaning things 
        // like aprefix or @prefix also work

        // TODO: make this not work based on len of prefix, 
        // so !prefix actually works likes its supposed too
        message.channel.send(`My prefix is currently ${bot.prefix}`);
    }
});


// Some Event listeners
bot.on('error', (error) => {
    console.error(`Something went wrong... ${JSON.stringify(error, null, 2)}`);
});
// This handle's a ctrl-c interrupt
process.on('SIGINT', () => {
    console.log('aught interrupt signal');
    process.exit(1);
});
// Heroku send's a sigterm once every 24 hours
process.on('SIGTERM', () => {
    console.log('Goodbye!');
    process.exit(0);
});

// do different things in dev vs prod mode
if (process.env.NODE_ENV === 'dev') {
    require('dotenv').config();
    bot.login(process.env.discordtoken_dev);
} else if (process.env.NODE_ENV === 'production') {
    bot.login(process.env.discordtoken);

    // Heroku will disable a dynamo if it doesn't get traffic every so often
    // by pinging our own application, we can prevent this
    setInterval(() => {
        request({
            uri: 'https://catbitchbot.herokuapp.com',
        }).catch((err) => {
            console.log('this isnt supposed to happen');
        });
    }, 900000);
} else {
    console.error(`Fatal Error! NODE_ENV not defined! Try running this bot with 'npm run start or npm run dev'`);
    process.exit(1);
}