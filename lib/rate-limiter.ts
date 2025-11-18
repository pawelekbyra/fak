import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';
import { headers } from 'next/headers';

// Create a new ratelimiter, that allows 5 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: '@upstash/ratelimit',
});

export async function checkRateLimit(userId?: string) {
  const identifier = userId || headers().get('x-forwarded-for') || '127.0.0.1';

  if (!identifier) {
    // This should not happen in a real environment, but as a fallback
    return { success: false, message: 'Could not determine identifier for rate limiting.' };
  }

  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return { success: false, message: 'Too many requests. Please try again later.' };
  }

  return { success: true };
}
