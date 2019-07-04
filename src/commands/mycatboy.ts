import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { db } from '../utils/db';

const search = db.prepare('SELECT url FROM favorites WHERE uid = ?');

export default async (message: Message): Promise<void> => {
   const catboy = search.get(message.author.id);
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
   const msg = await message.channel.send('You don\'t have a favorite catboy! React with :cat: to one of my messages to select your favorite catboy!') as Message;
   msg.delete(8000);
};

export const help = {
   name: 'mycatboy',
   help: 'Sends your own personal catboy :kissing_cat:',
   timeout: 2000,
};
