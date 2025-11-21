
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function upload() {
  try {
    const filePath = path.join(process.cwd(), 'jajk.png');
    if (!fs.existsSync(filePath)) {
      console.error('jajk.png not found');
      return;
    }
    const fileBuffer = fs.readFileSync(filePath);

    console.log('Uploading jajk.png...');
    const blob = await put('jajk.png', fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN // Ensure token is used if env var is tricky
    });

    console.log('Upload successful!');
    console.log('URL:', blob.url);
  } catch (error: any) {
    // If it exists and we didn't pass allowOverwrite (or if we want to just respect it exists)
    // Actually, the goal is just to get the URL.
    if (error.message && error.message.includes('already exists')) {
        console.log('Blob already exists. Assuming URL based on standard Vercel Blob pattern or previous run.');
        // We can try to just list it or just proceed if we know the URL pattern.
        // But to be safe and explicit, let's just allow overwrite to confirm we have control.
        console.log('Retrying with overwrite...');
        const blobRetry = await put('jajk.png', fileBuffer, {
          access: 'public',
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN
          // Note: The error message suggested `allowOverwrite: true`.
          // However, types might not show it if older version?
          // Let's try adding it to the options object forcefully if TS complains, but here it is JS/TS execution.
        });
         console.log('Upload successful!');
         console.log('URL:', blobRetry.url);
    } else {
        console.error('Error uploading:', error);
    }
  }
}

async function uploadWithOverwrite() {
    try {
    const filePath = path.join(process.cwd(), 'jajk.png');
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
