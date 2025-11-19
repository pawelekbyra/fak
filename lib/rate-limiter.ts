import { redis } from './kv';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
}

export async function rateLimit(key: string, limit: number, duration: number): Promise<RateLimitResult> {
  const requestKey = `${key}:requests`;

  const pipeline = redis.pipeline();
  pipeline.incr(requestKey);
  pipeline.expire(requestKey, duration);

  const result = await pipeline.exec<[number, number]>();
  const count = result[0] as number; // The result of incr

  const remaining = Math.max(0, limit - count);

  return {
    success: count <= limit,
    limit: limit,
    remaining: remaining,
  };
}
