import Ably from 'ably';

let key = process.env.ABLY_API_KEY;

if (!key) {
  console.warn('ABLY_API_KEY environment variable not set. Using placeholder for build.');
  key = 'placeholder:key';
}

export const ably = new Ably.Rest({ key });
