import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { findUserById } from '@/lib/db';
import { User } from './db.interfaces';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set in production.');
}

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-fallback-secret-for-development');
const COOKIE_NAME = 'session';
export { jwtSecret, COOKIE_NAME };

export interface AuthPayload {
    user: Omit<User, 'password'>;
    iat: number;
    exp: number;
}

// Type guard to validate the user object from the JWT payload
function isUserPayloadValid(user: any): user is Omit<User, 'password'> {
    if (!user) return false;
    return typeof user.id === 'string' &&
           typeof user.email === 'string' &&
           typeof user.username === 'string' &&
           typeof user.sessionVersion === 'number';
}

export async function verifySession(): Promise<AuthPayload | null> {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
        // 1. Verify token signature
        const { payload } = await jwtVerify(sessionCookie.value, jwtSecret);
        const authPayload = payload as AuthPayload;

        // 2. Validate payload structure
        if (!isUserPayloadValid(authPayload.user)) {
            console.warn("JWT payload is malformed.");
            return null;
        }

        // 3. Fetch user from DB to ensure they still exist
        const userFromDb = await findUserById(authPayload.user.id);
        if (!userFromDb) {
            console.warn(`User ${authPayload.user.id} from JWT not found in DB.`);
            return null;
        }

        // 4. Compare session versions to detect forced logouts
        if (userFromDb.sessionVersion !== authPayload.user.sessionVersion) {
            console.warn(`Stale session token for user ${userFromDb.id}.`);
            return null;
        }

        // 5. Return the valid payload
        return authPayload;

    } catch (error) {
        console.warn("Session verification failed:", error);
        return null;
    }
}
