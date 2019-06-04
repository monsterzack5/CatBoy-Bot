'use strict';
const fs = require('fs');
const ttPinger = require('./tools/ttPinger');
const fileLoader = require('./tools/fileLoader');
const name = require('./tools/getUserName');
const dbFile = 'tiktokers_ttg.json'

module.exports.run = async (message, args, command, bot) => {
    // this command is ment to add tiktokers to tiktokers.json

    // this checks if the user has a role called Admin or Moderator, or if its me running the command
    if (!message.member.roles.some(r => ["Admin", "Moderator"].includes(r.name))) {
        if (message.author.id.toString() !== '185513703364362240') {
            return message.channel
                .send(`Error! You need the role 'Admin' or 'Moderator' to use this command.`);
        }
    }
    // this checks if the given command was just: `-command`
    if (!args.length) return message.channel.send('first modifier should be [add] or [delete] or [list]');

    // this loads the tiktokers file and handles errors for if it contains bad data or file was not found 
    try {
        var users = JSON.parse(fs.readFileSync(dbFile));
    } catch (err) {
        console.error('(tiktok): issue loading tiktokers_ttg.json');
        return message.channel.send(`if you're reading this, something went wrong when it was never supposed to go wrong (retry the command)`);
    }

    // this gets us an array of all userNames in tiktokers.json
    const allUsers = Object.keys(users);

    switch (args[0].toLowerCase()) {

        case 'add':
            // this checks if we have the correct number of arguments
            if (args.length !== 2) return message.channel.send('Error! Format change! New format is: !live add [user_id]');

            addUser(users, allUsers, args[1], message.id, message.channel.id, bot).then((data) => {
                // in this function, we always Promise.resolve the message we want to send to the user
                message.channel.send(data);
            }).catch((err) => {
                console.log(`(tiktok)[add]: Error: ${err}`);
                return message.channel.send('An error occurred, try running the command again.');
            });
            break;


        case 'delete':
            // we're here if we should delete X input'ed user from the given channel

            if (args[1] === undefined) {
                return message.channel.send('Error! I need to know who to delete!');
            }

            deleteUser(users, allUsers, args[1], message.channel.id, bot).then((data) => {
                // in this function, we always Promise.resolve the message we want to send to the user
                message.channel.send(data);
            }).catch((err) => {
                console.log(`(tiktok)[del]: Error: ${err}`);
                return message.channel.send('An error occured, try running the command again');
            });
            break;

        case 'list':
            let description = [];

            for (let i = 0; i < allUsers.length; i++) {
                description.push(allUsers[i] + '\n')
            }
            message.channel.send({
                'embed': {
                    'title': 'Currently giving notifications for:',
                    'description': description.join(''),
                    'color': 1325771
                }
            });
            break;
            // commands past here are only for debug purposes and never meant to be used by anyone but me

        case 'update':
            message.channel.send('Updating!');
            ttPinger.checkIfNewVideos(bot);
            break;

        case 'updatett':
            message.channel.send('Updating the users using local tiktokers.json');
            fileLoader.exportFile(bot, dbFile);

            break;

        case 'updateconfig':
            message.channel.send('Updating the users using local config.json');
            fileLoader.exportFile(bot, 'config_ttg.json');

            break;

        case 'dump':
            message.channel.send({
                files: [dbFile]
            });
            break;

        case 'live':
            message.channel.send(`Refreshing who's live!`);
            ttPinger.checkIfLive(bot);
            break;


        case 'code':
            if (fs.existsSync(`./baddata${args[1]}.json`)) {
                message.channel.send({
                    files: [`./baddata${args[1]}.json`]
                });
            } else return message.channel.send(`Couldnt find that file`);
            break;

        default:
            return message.channel.send('Unexpected first modifier, should be: [add] or [delete] or [list]');
    }
}
async function addUser(users, allUsers, user_id, msg_id, chan_id, bot) {
    // this function will handle all of our logic for adding a user

    // this tries to get the userName of the user_id
    try {
        var userName = await name.getUserName(user_id);
    } catch (err) {
        return Promise.resolve(`Encountered an error getting the username of ${user_id}, seems like an incorrect user_id.`);
    }

    // this checks if the user_id already exists in our db, as we NEVER want to duplicate user_id's in our db
    const userExists = allUsers.find(user => user_id === users[user].userID);

    // userExists is a string if the user_id in our db, and `undefined` if its not
    if (userExists) {
        // if user_id is in the db, we check for if the api received userName is in the db, or if the user changed their name 
        if (allUsers.find(user => userName === user)) {
            // this checks if the chan_id is already in the channels array for said user
            if (users[userName].channels.find(channel => channel === chan_id)) {
                // we're here if: user_id in db, user has correct userName, chan_id already in channels [] 
                return Promise.resolve(`Error! This channel is already receiving notifications for ${userName}!`);
            } else {
                // we're here if: user_id in db, user has correct userName, chan_id is not in channels []
                // if the user exists, but the chan_id isnt getting notifications, we push the chan_id to the channels array
                users[userName].channels.push(chan_id);
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`This channel will now receive notifications for ${userName}!`);
            }
        } else {
            // we're here if: user_id in db, user has the wrong userName
            users[userName] = users[userExists];
            delete users[userExists];
            fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
            fileLoader.exportFile(bot, dbFile);
            // this checks if the chan_id is already in the channels array for said user
            if (users[userName].channels.find(channel => channel === chan_id)) {
                // we're here if: user_id in db, user ha(d) the wrong userName, chan_id already in channels []
                return Promise.resolve(`Error! This channel is already receiving notifications for ${userName}!`);
            } else {
                // we're here if: user_id in db, user ha(d) the wrong userName, chan_id is not in channel []
                users[userName].channels.push(chan_id);
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`This channel will now receive notifications for ${userName}!`)
            }
        }
    } else {
        // we're here if: the userName AND user_id don't exist in the db
        console.log(`Added new user into the database! name: ${userName}`);
        users[userName] = {
            last_post: '',
            userID: user_id,
            isLive: 0,
            live_msgs: [],
            channels: [chan_id]
        };
        fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
        fileLoader.exportFile(bot, dbFile);
        return Promise.resolve(`This channel will now receive notifications for ${userName}!`)
    }
}

async function deleteUser(users, allUsers, usrToDel, chan_id, bot) {
    // this function is ment to delete a user from the db based on userName or user_id
    // usrToDel: inputed data from the discord message

    // this line is seperate, because we use it's returned value to know the key of the user in our db
    const userIDExists = allUsers.find(user => usrToDel === users[user].userID);

    if (userIDExists) {
        // if the user exists in our db via user_id search

        // this checks if the current channel is getting notifications for the user
        if (users[userIDExists].channels.find(ids => chan_id === ids)) {
            if (users[userIDExists].channels.length === 1) {
                // if only 1 channel is getting notifications, we delete the object with the user
                delete users[userIDExists];
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`${userIDExists} has been successfully deleted!`);
            } else {
                // if more than 1 channel is getting notifications, we reverse filter the channels arr for the current chan_id
                // this returns an array with every item in an array that DOESNT match the chan_id
                users[userIDExists].channels = users[userIDExists].channels.filter(ids => chan_id !== ids);
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`${usrToDel} has been successfully deleted!`);
            }
        } else {
            return Promise.resolve(`Error! This channel is not receiving notifications for ${usrToDel}!`)
        }
    } else if (allUsers.find(user => usrToDel === user)) {
        // if the given user exists in our db via userName search

        // this checks if the current channel is getting notifications for the user
        if (users[usrToDel].channels.find(ids => chan_id === ids)) {
            if (users[usrToDel].channels.length === 1) {
                // if only 1 channel is getting notifications we delete the object with the user
                delete users[usrToDel];
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`${usrToDel} has been successfully deleted!`);
            } else {
                // if more than 1 channel is getting notifications, we reverse filter the channels arr for the current chan_id
                // this returns an array with every item in an array that DOESNT match the chan_id
                users[usrToDel].channels = users[usrToDel].channels.filter(ids => chan_id !== ids);
                fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
                fileLoader.exportFile(bot, dbFile);
                return Promise.resolve(`${usrToDel} has been successfully deleted!`);
            }
        } else {
            return Promise.resolve(`Error! This channel is not receiving notifications for ${usrToDel}!`)
        }
    } else {
        return Promise.resolve('Error! User not found in database!');
    }
}

module.exports.help = {
    name: 'live',
    help: '[list/add/delete] (username) (postID (17-20 char))'
}