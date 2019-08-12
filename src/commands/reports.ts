import { Message } from 'discord.js';
import { db } from '../utils/db';

const selectMostReported = db.prepare('SELECT * FROM reports ORDER BY num DESC LIMIT 5');
const deleteReport = db.prepare('DELETE FROM reports WHERE url = ?');

export default (message: Message): void => {
   if (message.author.id !== process.env.botOwner) {
      message.react('❌');
      return;
   }
   const badCats = selectMostReported.all();
   if (!badCats.length) {
      message.channel.send('No more reports!');
      return;
   }
   for (const cat of badCats) {
      deleteReport.run(cat.url);
      message.channel.send({
         embed: {
            image: {
               url: cat.url,
            },
         },
      });
   }
};

export const help = {
   name: 'reports',
   timeout: 5500,
};
