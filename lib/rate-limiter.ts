import { redis } from './kv';

export async function rateLimit(
  identifier: string,
  limit: number,
  duration: number
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`;

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, duration, 'NX');

  const [count] = await pipeline.exec<[number, number]>();

  const remaining = limit - count;
  const success = remaining >= 0;

  return { success, remaining };
}
