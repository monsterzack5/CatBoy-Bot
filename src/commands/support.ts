import { Message } from 'discord.js';

export default (message: Message): void => {
   message.channel.send('If you need any support feel free to dm `-Zach#3260`');
};

export const help = {
   name: 'support',
   help: 'If you need any support :scream_cat:',
   timeout: 10000,
};
