import { Message } from 'discord.js';
import { db } from '../utils/db';

const searchBing = db.prepare('SELECT * FROM bingcats WHERE url = ?');
const searchBooru = db.prepare('SELECT * FROM boorucats WHERE url = ?');
const searchChan = db.prepare('SELECT * FROM chancats WHERE posttime = ?');

export default async (message: Message, args: string[]): Promise<void> => {
   if (args.length !== 1) {
      const msg = await message.channel.send(`Incorrect format, format should be: ${process.env.prefix}why <url of an image i've sent>`) as Message;
      msg.delete(3000);
      return;
   }

   let url = args[0];
   if (url.startsWith('`') && url.endsWith('`')) {
      url = url.substring(1, url.length - 1);
   }

   if (url.startsWith('https://i.4cdn.org/cm/')) {
      const posttime = url.substring(22, 35);
      const chanCat = searchChan.get(posttime);
      if (chanCat) {
         message.channel.send(`Cat is from an 4chan\nPost number: \`${chanCat.postno}\` extension: \`${chanCat.ext}\` Timestamp+mills: \`${chanCat.posttime}\`\nHeight: \`${chanCat.height}\` Width: \`${chanCat.width}\` Filesize: \`${(chanCat.filesize / 1024 / 1024).toFixed(2)}MB\`\nthread op: \`${chanCat.op}\` MD5: \`${chanCat.md5}\``);
      } else {
         message.channel.send('Oops! can\'t find that url in my database!');
      }
      return;
   }
   const isBing = searchBing.get(url);
   if (isBing) {
      message.channel.send(`Cat is from bing, with ID: ${isBing.id} and Url: \`${isBing.url}\`\nHeight: ${isBing.height}, Width: ${isBing.width}\nPosted on: ${isBing.dateposted}\nAccentColor: ${isBing.color}\nName: ${isBing.name}`);
      return;
   }
   const isBooru = searchBooru.get(url);
   if (isBooru) {
      message.channel.send(`Cat is from booru, with Url: \`${isBooru.url}\`\nSource: \`${isBooru.source}\`\nHeight: ${isBooru.height}, Width: ${isBooru.width}, Score: ${isBooru.score}\nTags: ${isBooru.tags}`);
   }
};

export const help = {
   name: 'why',
   timeout: 300,
   help: '<image url> -> gives info about why an image is in my database',
};
