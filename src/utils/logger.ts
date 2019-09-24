import { TextChannel } from 'discord.js';
import { bot } from './bot';


class Logger {
   private errorChannel: TextChannel;

   private logChannel: TextChannel;

   public constructor() {
      this.errorChannel = bot.channels.get(process.env.errorsChannel as string) as TextChannel;
      this.logChannel = bot.channels.get(process.env.loggingChannel as string) as TextChannel;
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
      const cleanMessage = this.cleanMessage(`${time} LOG: ${message}`);
      console.log(cleanMessage);
      this.logChannel.send(cleanMessage);
   }

   public warn(message: string, error?: Error): void {
      const time = this.timeStamp();
      const cleanMessage = (error ? `${time} WARN: ${message}\n${error.message}\n------${error.stack}` : `${time} WARN: ${message}`);
      console.warn(cleanMessage);
      this.errorChannel.send(cleanMessage);
   }

   public error(message: string, error: Error): void {
      const time = this.timeStamp();
      const cleanMessage = this.cleanMessage(`${time} <@!${process.env.botOwner}> ${message} ERROR:\n${error.message}\n------${error.stack}`);
      console.error(cleanMessage);
      this.errorChannel.send(cleanMessage);
   }
}

export const logger = new Logger();
