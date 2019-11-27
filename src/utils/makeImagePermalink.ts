import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { db } from './db';
import { logger } from './logger';
import { exportFile } from './fileLoader';
import { downloadFile } from './downloadFile';

const insertStoredImage = db.prepare('INSERT INTO storedcats (md5, url, originalurl) VALUES (?, ?, ?)');

const selStoredImageMd5 = db.prepare('SELECT url FROM storedcats WHERE md5 = ?');
const selUrlFromOGUrl = db.prepare('SELECT url FROM storedcats WHERE originalurl = ?');

// this function takes a given image url, uploads that image to a discord channel
// then updates our db with that new image url
export async function makeImagePermalink(url: string): Promise<string | undefined> {
   // check if the given url already has a permalink
   const alreadyStored = selUrlFromOGUrl.get(url);
   if (alreadyStored) {
      return alreadyStored.url;
   }

   // this could be done more eloquently using the `Content-Type` header
   const fileExtention = url.match(/\.\w{3,4}($|\?)/);
   if (!fileExtention) {
      throw new Error(`Error! Cannot infer file extention from url: ${url}`);
   }

   if (!existsSync('./tmp/')) {
      mkdirSync('./tmp/');
   }

   const fullFileName = `${Math.random().toString(36).substring(2, 15)}${fileExtention[0]}`;

   // try to download the file, catch on fail
   let md5: string;
   try {
      md5 = await downloadFile(url, fullFileName, './tmp/', true) as string;
   } catch (e) {
      logger.error('fileLoader::makeImagePermalink', e);
      return undefined;
   }

   // check if that md5 already exists in the db
   const isAlreadyStored = selStoredImageMd5.get(md5);
   if (isAlreadyStored) {
      unlinkSync(`./tmp/${fullFileName}`);
      return isAlreadyStored.url;
   }

   const uploadedUrl = await exportFile(`./tmp/${fullFileName}`, false, process.env.storageChannel, false);
   if (uploadedUrl) {
      unlinkSync(`./tmp/${fullFileName}`);
   }

   insertStoredImage.run(md5, uploadedUrl, url);
   return uploadedUrl;
}
