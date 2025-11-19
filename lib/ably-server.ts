import Ably from 'ably';

if (!process.env.ABLY_API_KEY) {
  throw new Error('ABLY_API_KEY environment variable not set');
}

export const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });
