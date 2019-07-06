import { readdirSync } from 'fs';
import randomColor from 'randomcolor';
import { LookUpTable, Command, DiscordEmbedReply } from '../typings/interfaces';

// Variables

// var to cache all the command files
let cmdFiles: Command[];
// map of all botCommands, will be exported to index.ts
const botCommands = new Map();
// lookup table we will export to antispam.ts
const lookUpTable: LookUpTable = {};
// default time limit for a command if none was specified
const defaultTimeLimit = 1000;

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
   try {
      for (const command of cmdFiles) {
         botCommands.set(command.help.name, command.default);
      }
   } catch (e) {
      console.error('Error importing commands, malformed command file!');
      process.exit(123);
   }
   return botCommands;
}

// creates the help embed
export function createCommandsEmbed(): DiscordEmbedReply {
   if (!cmdFiles) {
      console.error(new Error('Error! Failed to create help emend, did you load the files first?'));
      process.exit(123);
   }
   const commandDesc: string[] = [];
   for (const command of cmdFiles) {
      if (command.help.help) {
         commandDesc.push(`**${process.env.prefix}${command.help.name}**: ${command.help.help}\n`);
      }
   }
   commandDesc.push('\nsee any BAD catboys? report them by reacting with :pouting_cat:!');
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
   if (!cmdFiles) {
      console.error(new Error('Error! Failed to create antispam lookup table, did you load the files first?'));
      process.exit(123);
   }
   for (const command of cmdFiles) {
      if (command.help.timeout) command.help.timeout = defaultTimeLimit;
      lookUpTable[command.help.name] = command.help.timeout as number;
   }
   return lookUpTable;
}