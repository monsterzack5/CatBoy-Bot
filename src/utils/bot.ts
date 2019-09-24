import Discord from 'discord.js';

class Bot {
   public bot!: Discord.Client;

   constructor() {
      this.bot = new Discord.Client();
   }
}

export const { bot } = new Bot();
