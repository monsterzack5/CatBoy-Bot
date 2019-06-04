/**
 * The idea, and theory behind this antispam function is based off of:
 * https://github.com/Michael-J-Scofield/discord-anti-spam/
 * 
 * But the code used is entirely my own, written by me.
 * As the original npm module is programmed differently from my needs.
 */

// Constants
const time_limit = 1500;

// containers 
let messages = [];

// TODO: 
/**
 * TODO: 
 * const exempt = ['Role', 'Names', 'Here'];
 * add a limiter so the global queue doesn't overflow
 * maybe a different data structure?
 */



async function checkAntiSpam(message, command) {
    // this function will only receive messages which the bot will do something with
    // so we don't need to worry about validating _every_ message the bot gets

    /**
     * this function will:
     * save each message in an array (maybe a collection would be better?)
     *   -Save the _command_ ran, the _time_ it was ran, and the _author_
     * will have values to check if a user is trying to run a command again
     *   -Users should only be able to use each command every X seconds
     * 
     * This function will **not** warn people for spam, or do any mod actions.
     */


    // console.log('asdf');


    // use .filter to make a new array called _good_
    // we only add an item to good, if the auth and cmd are the same
    let good = messages.find(msg => {
        if (msg.auth === message.author.id &&
            msg.cmd === command) {
            return true;
        }
    });

    // if no messages are found, eg: they have never used the command
    // we should ALWAYS add to the queue
    if (good === undefined) {
        // console.log('no prev message found, adding');
        // console.log(`Good is \n${JSON.stringify(good, null, 2)}`)
        pushToMessages(message, command);
        // messages.push({
        //     'time': Date.now(),
        //     'auth': message.author.id,
        //     'cmd': command
        // });
        return Promise.resolve(false);
    }

    // console.log(`Good is \n${JSON.stringify(good, null, 2)}`);

    // if the message time is less than the allowed time
    // then the message isn't spam.
    if (good.time < (Date.now() - time_limit)) {
        // console.log('you good');

        // add the message to an array
        // messages.push({
        //     'time': Date.now(),
        //     'auth': message.author.id,
        //     'cmd': command
        // });
        // console.log(`messages before ${JSON.stringify(messages, null, 2)}`)

        const temp = messages.filter(msg => {
            if (msg.auth !== message.author.id &&
                msg.cmd !== command) {
                return true;
            }
        });
        // console.log('should be good');
        //console.log(`temp: ${JSON.stringify(temp, null, 2)}`);
        messages = temp;
        pushToMessages(message, command);
        // console.log(`in the end, messages is ${JSON.stringify(messages, null, 2)}`);
        // console.log(`messages is now ${JSON.stringify(messages)}`);
        return Promise.resolve(false);
    } else {
        // console.log('not good');
        return Promise.resolve(true)
    }
}

function pushToMessages(message, command) {
    messages.push({
        'time': Date.now(),
        'auth': message.author.id,
        'cmd': command
    });
    return;
}

module.exports = {
    checkAntiSpam
}