import { Worker } from 'worker_threads';
import { logger } from './logger';

const MAX_DOWNLOAD_TIME = 60000;

export async function downloadFile(url: string, fileName: string, path?: string, doHash = false): Promise<string | void> {
   return new Promise((resolve, reject) => {
      const downloadWorker = new Worker('./dist/workers/downloadFile_worker.js', {
         workerData: [url, fileName, path, doHash],
      });
      // on emit md5, return immediately
      downloadWorker.once('message', (md5: string) => resolve(md5));
      downloadWorker.once('exit', () => resolve());
      downloadWorker.on('error', (e) => {
         logger.error('Worker Thread repored an error', e);
      });

      // reject if file not downloaded in X milliseconds
      setTimeout(reject, MAX_DOWNLOAD_TIME);
   });
}
