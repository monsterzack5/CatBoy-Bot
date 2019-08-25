import { statSync, createWriteStream } from 'fs';
import got from 'got';
import { TextChannel } from 'discord.js';
import { bot } from './bot';

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

async function downloadFile(url: string, fileName: string): Promise<void> {
   await new Promise((resolve) => {
      got.stream(url, {
         headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
         },
      })
         .pipe(createWriteStream(fileName))
         .on('finish', () => resolve());
   });
}

export async function importFile(fileName: string): Promise<boolean> {
   const path = fileName.match(/.*\/([^\\]+)\//);
   if (path) {
      throw new Error('Imported files should not contain filepaths.');
   }
   const channel = await bot.channels.get(process.env.dbChannel as string) as TextChannel;
   if (!channel) {
      throw new Error(`Unable to read channel: ${process.env.dbChannel}, Bad Permissions or incorrect env vars`);
   }
   const msgs = await channel.fetchMessages();
   const file = msgs.find(m => !!(m.attachments.size && m.attachments.first().filename === fileName));
   if (!file) {
      throw new Error(`file: ${fileName} not found`);
   }
   await downloadFile(file.attachments.first().url, fileName);
   console.log(`Imported file: ${fileName}`);
   return (file.attachments.first().filesize === statSync(fileName).size);
}

export async function exportFile(fName: string, isArchive?: boolean): Promise<boolean> {
   let fileName = fName;
   // if the fileName contains a path, we remove the path and just get the fileName
   const path = fileName.match(/.*\/([^\\]+)\//);
   if (path) {
      fileName = fileName.slice(path[0].length);
   }
   // get the channel and make sure its not undefined
   const channel = await bot.channels.get(process.env.dbChannel as string) as TextChannel;
   if (!channel) {
      throw new Error(`Unable to read channel: ${process.env.dbChannel}, Bad Permissions or incorrect env vars`);
   }
   // if we are told to archive the file, we upload it without deleting the old version
   if (isArchive) {
      const archive = bot.channels.get(process.env.archiveChannel as string) as TextChannel;
      if (archive) {
         await archive.send({ files: [fileName] });
      }
   }
   const msgs = await channel.fetchMessages();
   const file = msgs.find(m => !!(m.attachments.size
      && m.attachments.first().filename === fileName));
   if (!file) {
      throw new Error(`file: ${fileName} not found`);
   }

   // send the new file, so if something crashes the old file is still in the chan
   await channel.send({ files: [fileName] });
   // delete the old file
   const oldMsg = await channel.fetchMessage(file.id);
   await oldMsg.delete();
   return true;
}
