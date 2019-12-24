import { statSync } from 'fs';
import { TextChannel, Message } from 'discord.js';
import { bot } from './bot';
import { downloadFile } from './downloadFile';

/**
 * Export will upload a given file to either dbChannel, or a given discord channel,
 * and delete the previous version of that file on discord (by default, change with deleteOld)
 * You can also choose to archive said file, which means we upload it to a specific archiveChannel
 * AND we upload it to dbChannel, we never delete the old version in the archiveChannel.
 *
 * Import will take a fileName and search a discord channel for an attachment
 * that has the same name, and download it to the root directory
 */

function getPath(path: string): RegExpMatchArray | void {
   return (path.match(/.*\/([^\\]+)\//) || undefined);
}

export async function importFile(fileName: string): Promise<boolean> {
   if (getPath(fileName)) {
      throw new Error('Imported files should not contain filepaths.');
   }
   const channel = bot.channels.get(process.env.dbChannel) as TextChannel;
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

export async function exportFile(
   fName: string, doArchive?: boolean, channelId = process.env.dbChannel, deleteOld = true,
): Promise<string> {
   // if the fileName contains a path, we remove the path and just get the fileName
   if (!channelId) {
      throw new Error('Error! channelId set incorrectly!');
   }
   const path = getPath(fName);
   const fileName = (path ? fName.slice(path[0].length) : fName);
   const channel = bot.channels.get(channelId) as TextChannel;
   if (!channel) {
      throw new Error(`Unable to read channel: ${channelId}`);
   }

   // if we are told to archive the file, we upload it without deleting the old version
   if (doArchive) {
      const archive = bot.channels.get(process.env.archiveChannel) as TextChannel;
      if (archive) {
         await archive.send({ files: [fName] });
      }
   }

   // upload the file first, just in case, then save uploaded url and id
   const uploadedFile = await channel.send({ files: [fName] }) as Message;
   const { url } = uploadedFile.attachments.first();
   const { id } = uploadedFile;

   // if told to delete the old version, search for the fileaName, then delete ALL old versions
   if (deleteOld) {
      const msgs = await channel.fetchMessages();
      const files = msgs.filter(m => !!(m.attachments.size
         && m.attachments.first().filename === fileName
         && m.id !== id));
      if (!files.size) {
         throw new Error(`file: ${fileName} not found`);
      }
      /* I did this as a oneliner because I hate readability :^) */
      // waits for all the messages returned in `files` to be deleted
      await Promise.all((await Promise.all(files.map(msg => channel.fetchMessage(msg.id)))).map(msg => msg.delete()));
   }
   return url;
}
