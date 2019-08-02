import { Message } from 'discord.js';
import * as http from 'http';

// these are basic typings that got doesnt have when its fully typed otherwise ???
declare module 'got' {
   interface Response<B extends Buffer | string | object> extends http.IncomingMessage {
      timings: {
         start: number;
         socket: number;
         lookup: number;
         connect: number;
         upload: number;
         response: number;
         end: number;
         error: object;
         phases: {
            wait: number;
            dns: number;
            tcp: number;
            request: number;
            firstByte: number;
            download: number;
            total: number;
         };
      };
   }
}

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
   source: () => DiscordEmbedImageReply;
   ratio: number;
}
