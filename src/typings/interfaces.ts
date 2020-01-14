import { Message } from 'discord.js';

declare global {
   // in required.ts, we check for these env vars, so strong typing them is Ok!u
   // eslint-disable-next-line @typescript-eslint/no-namespace
   namespace NodeJS {
      interface ProcessEnv {
         prefix: string;
         NODE_ENV: 'dev' | 'production';
         discordTokenDev: string;
         botOwner: string;
         dbChannel: string;
         configFile: string;
         configFileDev: string;
         dbFile: string;
         dbFileDev: string;
         bingToken: string;
         loggingChannel: string;
         errorsChannel: string;
         archiveChannel: string;
         storageChannel: string;
      }
   }
}

export type workerParams = [string, string, string?, boolean?];

export type Commands = Map<string, Command['default']>;

export type BotActions = Map<string, number>;

export interface Command {
   default(message?: Message, args?: string[]): void;
   help: {
      name: string;
      help?: string;
      timeout?: number;
      alias?: string[];
   };
}

export interface Post {
   no: number;
   sub: string;
   com: string;
   tim: number;
   resto: number;
   filename?: string;
   ext?: string;
   w?: number;
   h?: number;
   md5?: string;
   fsize?: number;
}

export interface ImagePost extends Post {
   filename: string;
   ext: string;
   w: number;
   h: number;
   md5: string;
   fsize: number;
}

export interface CatalogPosts {
   page: number;
   threads: Post[];
}

export interface ThreadPosts {
   posts: Post[];
}

export interface StoredMessage {
   time: number;
   auth: string;
   cmd: string;
}

export interface LookUpTable {
   [index: string]: number;
}

export interface ReturnedBingJSON {
   value: ReturnedBingJSON[];
   nextOffset: number;
   contentUrl: string;
   imageId: string;
   height: string;
   width: string;
   name: string;
   datePublished: string;
   accentColor: string;
}

export interface BingImage {
   url: string;
   id: string;
}


export interface ConfigOptions {
   prefix: string;
   gameUrl: string;
   game: string;
   gameState: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | undefined;
}

export interface RawReactData {
   t: string;
   s: number;
   op: number;
   d: {
      user_id: string;
      message_id: string;
      guild_id: string;
      channel_id: string;
      emoji: {
         name: string;
         id: string | null;
         animated: boolean;
      };
   };
}

export interface DiscordEmbedImageReply {
   embed: {
      title?: string;
      color: number;
      description: string;
      image: {
         url: string;
      };
   };
}

export interface DiscordEmbedReply {
   embed: {
      title?: string;
      color: number;
      description: string;
   };
}

export interface CommandFunction {
   (message: Message, args: string[]): void | Promise<void>;
}

export type RatioTuple = [RatioObject, RatioObject, RatioObject];

export interface RatioObject {
   source: (uid: string) => DiscordEmbedImageReply;
   ratio: number;
}

export interface Total {
   [key: number]: number;
}

export interface SortedList {
   [key: string]: number;
}

export interface ArchivedThreads {
   deletedThreads: number[];
   archivedThreads: number[];
}

export interface FilteredImage {
   id: string;
   source: string;
}

export interface StoredThread {
   postno: number;
   status: 'alive' | 'dead' | 'archived';
}
