'use strict';
const fs = require('fs');
const request = require('request');
const log_channel = process.env.database_channel;

/**
 * in a wonderful effort to defeat heroku's ephemeral filesystem and to never 
 * touch a real database, this file has 2 functions, export and import
 * 
 * Export will upload the file to a special discord channel and delete
 * the previous version of that file
 * 
 * Import will take a fileName and search a discord channel for an attachment
 * that has the same name, and import it
 * 
 */

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
                const isFileGood = await checkFile(fileName, m.attachments.first().filesize);
                if (!isFileGood) return reject('file integrity could not be determined');
                console.log(`Imported file: ${fileName}`);
                return resolve();
            });
            if (!fileFound) {
                return reject(`file: ${fileName} not found`);
            }
        });
    });
}

async function exportFile(bot, fileName, isFirst) {
    return new Promise((resolve) => {
        bot.channels.get(log_channel).fetchMessages().then((msgs) => {
            // tap is a forEach for discord collections
            msgs.tap(async (m) => {
                // various checks
                if (!m.attachments.size) return;
                if (m.attachments.first().filename !== fileName) return;

                // we delete the file that has fileName as an attachment
                console.log('asdfasdfasdf')
                bot.channels.get(log_channel).fetchMessage(m.id).then((msg) => {
                    console.log(`Exported ${fileName}`)
                    msg.delete(100);
                });
                // now we will send fileName to the correct channel
                bot.channels.get(log_channel).send({
                    files: [fileName]
                }).then(() => {
                    return resolve();
                })
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
                return resolve();
            });
    });
}

async function checkFile(fileName, fileSize) {
    return new Promise((resolve, reject) => {
        // this gets the fileSize of the file on disk
        const fileSize_disk = fs.statSync(fileName).size;
        // check disk fileSize against discord's reported fileSize
        if (fileSize_disk === fileSize) {
            return resolve(true);
        } else {
            return reject();
        }
    });
}

module.exports = {
    exportFile,
    importFile
}