import { Message } from 'discord.js';

export default (message: Message, args: string[]): void => {
   message.channel.send(args.join(' '));
};

export const help = {
   name: 'say',
   help: 'echos a message',
};
