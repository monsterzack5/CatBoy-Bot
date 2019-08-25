import { Message } from 'discord.js';
import randomColor from 'randomcolor';
import { db } from '../utils/db';
import { Total } from '../typings/interfaces';

const selectStats = db.prepare('SELECT bing,booru,chan FROM userstats WHERE uid = ?');
const selectSum = db.prepare('SELECT SUM(bing),SUM(booru),SUM(chan) FROM userstats');

export default async (message: Message): Promise<void> => {
   const mention = message.mentions.members.first();
   let { id, username } = message.author;

   if (mention) {
      ({ id, username } = mention.user);
   }

   const stats = selectStats.get(id);
   console.log(`stats:\n${JSON.stringify(stats, null, 2)}`);
   if (stats) {
      const color = parseInt((randomColor() as string).substring(1), 16);
      const total = Object.values(selectSum.get() as Total).reduce((acc, val) => (acc + val), 0);
      const userTotal = stats.bing + stats.booru + stats.chan;
      message.channel.send({
         embed: {
            color,
            description: `In total, **${username}** sent **${userTotal}** catboys, which is **${((total / userTotal) * 100).toFixed(2)}%** of total catboys!
            From booru's: **${stats.booru}**, 
            From bing: **${stats.bing}**, 
            From an image board: **${stats.chan}**`,
         },
      });
      return;
   }
   const msg = await message.channel.send(`It looks like ${username} has never sent any catboys :crying_cat_face:`) as Message;
   msg.delete(5000)
};

export const help = {
   name: 'mystats',
   help: 'To see cool stats!',
   timeout: 2000,
};
