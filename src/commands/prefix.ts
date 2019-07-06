import { readFileSync, writeFileSync } from 'fs';
import { Message } from 'discord.js';
import { exportFile } from '../utils/fileLoader';

export default (message: Message, args: string[]): void => {
   if (message.author.id !== process.env.botOwner) {
      message.react('❌');
      return;
   }
   const config = JSON.parse(readFileSync(`./${process.env.configFile}.json`).toString());
   if (args.length > 0) {
      [config.prefix] = args;
      [process.env.prefix] = args;
      message.channel.send('Prefix changed!');
      writeFileSync(`./${process.env.configFile}.json`, JSON.stringify(config, null, 2));
      exportFile(`${process.env.configFile}.json`);
   } else message.channel.send('Prefix can\'t be blank!');
};

export const help = {
   name: 'prefix',
};