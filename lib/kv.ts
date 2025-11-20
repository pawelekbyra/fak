import { Redis } from '@upstash/redis';

let url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
let token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.warn('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_ equivalents) environment variables are required. Using placeholder for build.');
  url = 'https://placeholder-url.upstash.io';
  token = 'placeholder-token';
}

export const redis = new Redis({
  url,
  token,
});
