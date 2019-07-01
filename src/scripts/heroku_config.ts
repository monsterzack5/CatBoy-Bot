import { execSync, ExecSyncOptions } from 'child_process';
// eslint-disable-next-line
import { DotenvParseOutput } from 'dotenv';

const options: ExecSyncOptions = { stdio: 'inherit' };
async function main(): Promise<void> {
   try {
      const dotenv = await import('dotenv');
      const parsedKeys = dotenv.config().parsed as DotenvParseOutput;
      const keys = Object.entries(parsedKeys);
      if (keys.length !== 10) {
         console.log('Error! No keys found in the local .env file');
         process.exit(1);
      }
      for (const [key, value] of keys) {
         execSync(`heroku config:set ${key}=${value}`, options);
      }
   } catch (e) {
      console.error('Error! Did you forget to run "yarn" or "npm install"?\n');
      console.log(`${e}`);
      process.exit(0);
   }
}
main();
