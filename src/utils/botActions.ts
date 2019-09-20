import { Message } from 'discord.js';
import randomColor from 'randomcolor';
import { SortedList } from '../typings/interfaces';
import { db } from './db';

const selectRandomAction = db.prepare('SELECT url FROM botactions WHERE action = ? LIMIT 1 OFFSET ?');
const selectAllActions = db.prepare('SELECT action FROM botactions');

export function getBotActions(): Map<string, number> {
   const allActions = selectAllActions.all().reduce((acc, key) => acc.concat(key.action), []);
   const sortedActions = allActions.reduce((prev: SortedList, cur: string) => {
      prev[cur] = (prev[cur] || 0) + 1; // eslint-disable-line no-param-reassign
      return prev;
   }, {});
   console.log(`sortedActions: ${JSON.stringify(sortedActions, null, 2)}`);
   return new Map(Object.entries(sortedActions));
}

export function handleBotActions(message: Message, command: string, count: number): void {
   const mention = message.mentions.members.first();
   if (!mention) {
      message.channel.send(`Are you trying to ${command} the void?`);
      return;
   }
   const random = Math.floor(Math.random() * count);
   const actionUrl = selectRandomAction.get(command, random);
   const color = parseInt((randomColor() as string).substring(1), 16);
   const userWhoActed = message.member.nickname || message.member.user.username;
   const userActedUpon = mention.nickname || mention.user.username;
   const title = (mention.nickname === message.member.nickname)
      ? `**${userWhoActed}** gave themselves a **${command}**!`
      : `**${userActedUpon}**, you got a ${command} from **${userWhoActed}**!`;
   message.channel.send({
      embed: {
         title,
         color,
         image: {
            url: actionUrl.url,
         },
      },
   });
}
