import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';

const search = db.prepare('SELECT url FROM favorites WHERE uid = ?');

export default async (message: Message): Promise<void> => {
   const mention = message.mentions.members.first();
   let { id } = message.author;
   let msg: Message;
   let username = '';

   if (mention) {
      ({ id } = mention.user);
      ({ username } = mention.user);
   }
   const catboy = search.get(id);
   if (catboy) {
      const color = parseInt((randomColor() as string).substring(1), 16);
      message.channel.send({
         embed: {
            color,
            image: {
               url: catboy.url,
            },
         },
      });
      return;
   }
   if (!mention) {
      msg = await message.channel.send('You don\'t have a favorite catboy! React with :cat: to one of my messages to select your favorite catboy!') as Message;
   } else {
      msg = await message.channel.send(`it looks like ${username} doesn't have a favorite catboy :crying_cat_face:`) as Message;
   }
   msg.delete(8000);
};

export const help = {
   name: 'mycatboy',
   help: 'Sends your own personal catboy :kissing_cat:',
   timeout: 2000,
};
