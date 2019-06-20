const fs = require('fs');
const request = require('request');
const { bot } = require('./helper');
/**
 * In a wonderful effort to defeat heroku's ephemeral filesystem and to never
 * touch a real database, this file has 2 functions, export and import
 *
 * Export will upload the file to a special discord channel and delete
 * the previous version of that file
 *
 * Import will take a fileName and search a discord channel for an attachment
 * that has the same name, and download it to the root directory
 *
 */

function downloadFile(url, fileName) {
   return new Promise((resolve) => {
      request({
         uri: url,
         headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
         },
      }).pipe(fs.createWriteStream(fileName))
         .on('finish', () => resolve());
   });
}

function checkFileSize(fileName, fileSize) {
   return new Promise((resolve, reject) => {
      // this gets the fileSize of the file on disk
      const fileSizeDisk = fs.statSync(fileName).size;
      // check disk fileSize against discord's reported fileSize
      return fileSizeDisk === fileSize ? resolve(true) : reject();
   });
}


function importFile(fileName) {
   return new Promise((resolve, reject) => {
      bot.channels.get(process.env.database_channel).fetchMessages().then(async (msgs) => {
         const file = msgs.find(m => m.attachments.size
            && m.attachments.first().filename === fileName);
         if (!file) {
            return reject(new Error(`file: ${fileName} not found`));
         }
         await downloadFile(file.attachments.first().url, fileName);
         const isFileGood = await checkFileSize(fileName, file.attachments.first().filesize);
         console.log(`Imported file: ${fileName}`);
         return isFileGood ? resolve(true) : reject();
      });
   });
}

function exportFile(fName, channel) {
   return new Promise((resolve, reject) => {
      bot.channels.get(process.env.database_channel).fetchMessages().then(async (msgs) => {
         let fileName = fName;

         // if the fileName contains a path, we remove the path and just get the fileName
         const path = fileName.match(/.*\/([^\\]+)\//);
         if (path) {
            fileName = fileName.slice(path[0].length);
         }

         const file = msgs.find(m => m.attachments.size
            && m.attachments.first().filename === fileName);
         if (!file) {
            return reject(new Error(`file: ${fileName} not found`));
         }
         // if we are told to archive the file, we upload it without deleting the old version
         if (channel === 'archive') {
            await bot.channels.get(process.env.archive_channel)
               .send({ files: [fileName] });
            return resolve();
         }
         // delete the old message after 2 seconds
         await bot.channels.get(process.env.database_channel).fetchMessage(file.id)
            .then(msg => msg.delete());

         // wait until we send the new message with the file
         await bot.channels.get(process.env.database_channel)
            .send({ files: [fileName] });
         return resolve();
      });
   });
}

module.exports = {
   exportFile,
   importFile,
};
