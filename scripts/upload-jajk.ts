
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function uploadWithOverwrite() {
    try {
    const filePath = path.join(process.cwd(), 'jajk.png');
    if (!fs.existsSync(filePath)) {
        console.error('jajk.png not found at', filePath);
        return;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const blob = await put('jajk.png', fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // @ts-ignore - valid option usually
      allowOverwrite: true
    });
    console.log('Upload successful!');
    console.log('URL:', blob.url);
    } catch (e) {
        console.error(e);
    }
}

uploadWithOverwrite();
