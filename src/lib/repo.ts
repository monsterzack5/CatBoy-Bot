import { Message } from 'discord.js';

export default (message: Message): void => {
   message.channel.send('Im fully open source! you can find the repo for me at\nhttps://github.com/monsterzack5/CatBoy-Bot');
};

export const help = {
   name: 'repo',
};
