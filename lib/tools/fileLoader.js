'use strict';
const fs = require('fs');
const request = require('request');
const log_channel = '554477335395696649';

/**
 * in a wonderful effort to defeat heroku's ephemeral filesystem and to never 
 * touch a real database, this file has 2 functions, export and import
 * 
 * Export will upload the file to a special discord channel and delete
 * the previous version of that file
 * 
 * Upload will take a file, and upload it to a special discord channel
 * 
 */


// EVERY FUNCTION THAT WORKS BY RETURNING A PROMISE SHOULD EXPLICITLY __RETURN NEW PROMISE__
// FUCK THIS "ASYNC MAKES A FUNCTION ALWAYS RETURN A PROMISE" BULLSHIT
// IT DOESNT FUCKING WORK.

async function importFile(bot, fileName) {
    return new Promise((resolve, reject) => {
        let fileFound = false;
        bot.channels.get(log_channel).fetchMessages().then((msgs) => {
            // tap is a forEach for discord collections
            msgs.tap(async (m) => {
                // various checks
                if (!m.attachments.size) return;
                if (m.attachments.first().filename !== fileName) return;

                // we're here if the found file matches the given fileName
                fileFound = true;
                await downloadFile(m.attachments.first().url, fileName);
                const isFileGood = await checkFile(fileName);
                if (!isFileGood) reject('file integrity could not be determined');
                console.log(`Imported file: ${fileName}`);
                resolve();
            });
            if (!fileFound) {
                reject(`file: ${fileName} not found`);
            }
        });
    });
}

async function exportFile(bot, fileName) {
    return new Promise((resolve) => {
        bot.channels.get(log_channel).fetchMessages().then((msgs) => {
            // tap is a forEach for discord collections
            msgs.tap(async (m) => {
                // various checks
                if (!m.attachments.size) return;
                if (m.attachments.first().filename !== fileName) return;

                // we delete the file that has fileName as an attachment
                bot.channels.get(log_channel).fetchMessage(m.id).then((msg) => {
                    console.log('tried to delete the old file')
                    msg.delete(100);
                });
                // now we will send fileName to the correct channel
                bot.channels.get(log_channel).send({
                    files: [fileName]
                });
            });
        });
    });
}

async function downloadFile(url, fileName) {
    return new Promise((resolve, reject) => {
        request({
                uri: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
                },
            }).pipe(fs.createWriteStream(fileName))
            .on('finish', () => {
                // ONLY finish this promise once the download is complete
                resolve();
            });
    })
}

async function checkFile(fileName) {
    return new Promise((resolve, reject) => {
        // this file currently is only ever supposed to check JSON files
        // so we can very easily hardcode this function to use JSON.parse 
        // to verify the file
        // which really isnt bad, but i dislike hardcoding __anything__

        // Discord exposes a .filesize to their messages collection
        // this function could use that filesize to verify the download
        // but thats something for future Zach to do
        try {
            JSON.parse(fs.readFileSync(fileName))
            resolve(true)
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    exportFile,
    importFile
}