import { Message } from 'discord.js';
import { handleFilter } from '../utils/react';
import { db } from '../utils/db';

const insertRegExp = db.prepare('INSERT OR REPLACE INTO filters (regex, source) VALUES (?, ?)');
const searchFilter = db.prepare('SELECT * FROM filters WHERE regex = ?');
const selectAllFilter = db.prepare('SELECT * FROM filters');
const deleteFilter = db.prepare('DELETE FROM filters WHERE regex = ?');

export default async (message: Message, args: string[]): Promise<void> => {
   if (message.author.id !== process.env.botOwner) {
      message.react('❌');
      return;
   }
   if (!args.length) {
      const msg = await message.channel.send('Incorrect format, format should be : <prefix>`filter <url>` or `filter add\\remove\\list [regex]`') as Message;
      msg.delete(4500);
      return;
   }
   if (args[0] === 'add') {
      let source = args[2];
      if (args.length === 2) {
         source = 'bing+booru';
      } else if (source !== ('bing' || 'booru' || 'bing+booru')) {
         message.channel.send('Error! source should either be `bing` or `booru` or `bing+booru`');
         return;
      }
      try {
         RegExp(args[0]);
      } catch (e) {
         message.channel.send(`Error! That doesn't appear to be a valid RegExp!\n${e}`);
         return;
      }
      insertRegExp.run(args[1], source);
      message.channel.send('Added regex!');
      return;
   }

   if (args[0] === 'remove') {
      const isRegex = searchFilter.get(args[1]);
      if (isRegex) {
         deleteFilter.run(args[1]);
         message.channel.send(`Deleted filter ${isRegex.regex}`);
         return;
      }
      message.channel.send('Error! I can\'t find that regex in my db :thinking:');
      return;
   }

   if (args[0] === 'list') {
      const allRegex = selectAllFilter.all();
      const reply = allRegex.reduce((acc, val) => `${acc}\n\`${val.regex}, for tables: ${val.source}\``, '');
      message.channel.send(`Currently active filters:${reply}`);
      return;
   }
   handleFilter(args[0], message);
};

export const help = {
   name: 'filter',
};
