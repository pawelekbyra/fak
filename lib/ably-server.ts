import Ably from 'ably';

if (!process.env.ABLY_API_KEY) {
  // In build time or if not set, we might warn, but throwing error breaks build if env vars are missing in build env
  console.warn('ABLY_API_KEY environment variable not set. Realtime features will fail.');
}

export const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY || 'placeholder:key' });
