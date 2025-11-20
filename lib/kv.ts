import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
    console.warn('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_ equivalents) environment variables are required. Using mock values for build.');
}

export const redis = new Redis({
  url: url || 'https://mock.upstash.io',
  token: token || 'mock_token',
});
