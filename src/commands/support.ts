import { Message } from 'discord.js';
import { logger } from '../utils/logger';

export default (message: Message): void => {
   message.channel.send('If you need any support feel free to dm `-Zach#3260`');
   logger.log(`Support command was called, by user: ${message.author.username} with uid: ${message.author.id}`);
};

export const help = {
   name: 'support',
   help: 'If you need any support :scream_cat:',
   timeout: 10000,
};
