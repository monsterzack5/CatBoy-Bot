import { Message } from 'discord.js';
import { getRandomCat } from './catboy';
import { DiscordEmbedImageReply } from '../typings/interfaces';

export default async (message: Message): Promise<void> => {
   const promiseCats = [1, 2, 3, 4, 5].map(() => getRandomCat(message.author.id)) as DiscordEmbedImageReply[];
   const cats = await Promise.all(promiseCats);
   const reply = cats.reduce((acc, key) => `${acc}\n${key.embed.image.url}`, '');
   message.channel.send(reply);
};

export const help = {
   name: 'catboydump',
   help: 'Sends a whole bunch of catboys! :scream_cat:',
   timeout: 10000,
};
