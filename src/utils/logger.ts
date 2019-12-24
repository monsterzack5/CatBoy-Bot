import { TextChannel } from 'discord.js';
import { bot } from './bot';


class Logger {
   private errorChannel: TextChannel;

   private logChannel: TextChannel;

   public constructor() {
      this.errorChannel = bot.channels.get(process.env.errorsChannel) as TextChannel;
      this.logChannel = bot.channels.get(process.env.loggingChannel) as TextChannel;
      if (!this.errorChannel || !this.logChannel) {
         console.error('FATAL ERROR! Logger failed to get logChannel | errorChannel');
         process.exit(1);
      }
   }

   private timeStamp(): string {
      const time = new Date();
      return `[${time.toLocaleString()}]:`;
   }

   private cleanMessage(message: string): string {
      return message.substr(0, 2000);
   }

   public log(message: string): void {
      const time = this.timeStamp();
      const cleanMessaged = this.cleanMessage(`${time} LOG: ${message}`);
      console.log(cleanMessaged);
      this.logChannel.send(cleanMessaged);
   }

   public warn(message: string, error?: Error): void {
      const time = this.timeStamp();
      const cleanMessaged = (error ? `${time} WARN: ${message}\n${error.message}\n------${error.stack}` : `${time} WARN: ${message}`);
      console.warn(cleanMessaged);
      this.errorChannel.send(cleanMessaged);
   }

   public error(message: string, error: Error): void {
      const time = this.timeStamp();
      const cleanMessaged = this.cleanMessage(`${time} <@!${process.env.botOwner}> ${message} ERROR:\n${error.message}\n------${error.stack}`);
      console.error(cleanMessaged);
      this.errorChannel.send(cleanMessaged);
   }
}

export const logger = new Logger();
