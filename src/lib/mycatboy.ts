import randomColor from 'randomcolor';
import { Message } from 'discord.js';
import { searchFavorite } from './tools/db';

export default async (message: Message): Promise<void> => {
   const catboy = searchFavorite.get(message.author.id);
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
};
