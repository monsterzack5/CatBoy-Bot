import { createWriteStream, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import stream from 'stream';
import { promisify } from 'util';
import got from 'got';
import { workerData, parentPort } from 'worker_threads';
import { workerParams } from '../typings/interfaces';

export async function downloadFile(url: string, fileName: string, path?: string, doHash = false): Promise<string | void> {
   if (!url || !fileName) {
      throw new Error('Error! Missing url or filename!');
   }

   const fullFileName = (path && existsSync(path) ? `${path}${fileName}` : `${fileName}`);
   const pipeline = promisify(stream.pipeline);
   const writeStream = createWriteStream(fullFileName);
   if (doHash) {
      const hash = createHash('md5');
      await pipeline(got.stream(url), writeStream);
      hash.write(readFileSync(fullFileName));
      const md5 = hash.digest('hex');
      if (parentPort) parentPort.postMessage(md5);
      return md5;
   }
   await pipeline(got.stream(url), writeStream);
   return undefined;
}

downloadFile(...(workerData as workerParams));
