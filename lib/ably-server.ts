import Ably from 'ably';

if (!process.env.ABLY_API_KEY) {
  console.warn('ABLY_API_KEY environment variable not set. Using dummy key for build.');
}

export const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY || 'dummy:key' });
