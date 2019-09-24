import { readdirSync } from 'fs';
import randomColor from 'randomcolor';
import { getBotActions } from './botActions';
import {
   LookUpTable, Command, DiscordEmbedReply,
} from '../typings/interfaces';

// var to cache all the command files
let cmdFiles: Command[];
const botActions = getBotActions();

// loads all the cmdFiles at boot, and caches them
async function loadFiles(): Promise<void> {
   const filepromises: Promise<Command>[] = [];
   const files = readdirSync('./dist/commands')
      .filter(f => f.endsWith('.js'));
   for (const file of files) {
      filepromises.push(import(`../commands/${file}`));
   }
   cmdFiles = await Promise.all(filepromises);
}

// creates the map that holds our commands
export async function createCommandsMap(): Promise<Map<string, Command>> {
   // since we ALWAYS run this function first, we can treat it as an init function
   await loadFiles();
   const botCommands = new Map();

   try {
      for (const command of cmdFiles) {
         botCommands.set(command.help.name, command.default);
      }
   } catch (e) {
      console.error('Error importing commands, malformed command file!');
      process.exit(1);
   }
   // merge botCommands map with botActions map, return merged
   return new Map([...botCommands, ...botActions]);
}

// creates the help embed
export function createHelpEmbed(): DiscordEmbedReply {
   if (!cmdFiles) {
      console.error(new Error('Error! Failed to create help embed, did you load the files first?'));
      process.exit(1);
   }
   const commandDesc: string[] = [];
   // const botActions = getBotActions();
   for (const command of cmdFiles) {
      if (command.help.help) {
         commandDesc.push(`**${process.env.prefix}${command.help.name}**: ${command.help.help}\n`);
      }
   }
   const actions = [...botActions.keys()].reduce((acc, key) => `${acc}, *${process.env.prefix}${key}*`, '').slice(2);
   if (botActions.size) {
      commandDesc.push(`\n**User interactions!** ${actions}`);
   }
   commandDesc.push('\n\nsee any BAD catboys? report them by reacting with :pouting_cat:!');
   const color = parseInt((randomColor() as string).substring(1), 16);
   return {
      embed: {
         color,
         title: 'Catboy Commands! uwu',
         description: commandDesc.join(' '),
      },
   };
}

// creates a lookup table for antispam
export function createTimeOutTable(): LookUpTable {
   const defaultTimeLimit = 1000;
   const lookUpTable: LookUpTable = {};

   if (!cmdFiles) {
      console.error(new Error('Error! Failed to create antispam lookup table, did you load the files first?'));
      process.exit(1);
   }
   for (const command of cmdFiles) {
      if (!command.help.timeout) command.help.timeout = defaultTimeLimit;
      lookUpTable[command.help.name] = command.help.timeout as number;
   }
   return lookUpTable;
}
