export function checkRequired(): boolean {
   if (process.env.discordToken
      && process.env.discordTokenDev
      && process.env.botOwner
      && process.env.dbChannel
      && process.env.configFile
      && process.env.configFileDev
      && process.env.dbFile
      && process.env.dbFileDev
      && process.env.bingToken
      && process.env.loggingChannel
      && process.env.errorsChannel
      && process.env.archiveChannel
      && process.env.storageChannel) {
      return true;
   }
   return false;
}
