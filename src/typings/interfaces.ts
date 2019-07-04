import { Message } from 'discord.js';

export interface ChanImage {
   ext: string;
   no: number;
}

export interface Post {
   tim?: number;
   ext?: string;
   no: number;
   sub: string;
   com: string;
   filename: string;
}

export interface ImagePost {
   tim: number;
   ext: string;
   no: number;
   sub: string;
   com: string;
   filename: string;
}

export interface CatalogPage {
   threads: ImagePost[];
   page: number;
}

export interface ThreadResponse extends Post {
   posts: Post[];
}
export interface StoredMessage {
   time: number;
   auth: string;
   cmd: string;
}

export interface Command {
   (message: Message, args: string[]): void;
   default(message: Message, args: string[]): void;
   help: {
      name: string;
      help?: string;
      timeout?: number;
   };
}

export interface LookUpTable {
   [index: string]: number;
}

export interface ReturnedJSON {
   value: ReturnedJSON[];
   nextOffset: number;
   contentUrl: string;
   imageId: string;
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

export interface DiscordEmbedReply {
   embed?: {
      title?: string;
      color: number;
      description: string;
      image?: {
         url: string;
      };
   };
}
