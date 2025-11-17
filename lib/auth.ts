import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { db } from '@/lib/db';
import { User } from './db.interfaces';

let jwtSecret: Uint8Array;
try {
    if (!process.env.JWT_SECRET) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error("JWT_SECRET environment variable is not set in production");
        } else {
            console.warn("JWT_SECRET not set. Using insecure default fallback key for development.");
            jwtSecret = new TextEncoder().encode('your-fallback-secret-for-development');
        }
    } else {
        jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    }
} catch (e: any) {
    console.error("Fatal error during JWT secret initialization:", e.message);
    process.exit(1);
}

const COOKIE_NAME = 'session';

export { jwtSecret, COOKIE_NAME };

export interface AuthPayload {
    user: Omit<User, 'password'>;
    iat: number;
    exp: number;
}

function isUserPayloadValid(user: any): user is Omit<User, 'password'> {
    if (!user) return false;
    if (typeof user.id !== 'string') return false;
    if (typeof user.email !== 'string') return false;
    if (typeof user.username !== 'string') return false;
    if (typeof user.sessionVersion !== 'number') return false;
    // Optional fields can be checked for type if they exist
    if (user.displayName && typeof user.displayName !== 'string') return false;
    if (user.avatar && typeof user.avatar !== 'string') return false;
    if (user.role && (user.role !== 'user' && user.role !== 'admin')) return false;
    return true;
}

export async function verifySession(): Promise<AuthPayload | null> {
    const sessionCookie = cookies().get(COOKIE_NAME);
    if (!sessionCookie) {
        return null;
    }

    try {
        // 1. Verify the token's signature and structure
        const { payload } = await jwtVerify(sessionCookie.value, jwtSecret);
        const authPayload = payload as unknown as AuthPayload;

        if (!isUserPayloadValid(authPayload.user)) {
            console.log("Token payload is malformed.");
            return null;
        }

        // 2. Fetch the user's current state from the database
        const userFromDb = await db.findUserById(authPayload.user.id);
        if (!userFromDb) {
            console.log(`User ${authPayload.user.id} not found in DB.`);
            return null;
        }

        // 3. Compare session versions
        if (userFromDb.sessionVersion !== authPayload.user.sessionVersion) {
            console.log(`Token session version mismatch for user ${userFromDb.id}. DB: ${userFromDb.sessionVersion}, Token: ${authPayload.user.sessionVersion}`);
            return null; // Stale token, reject it.
        }

        // 4. If everything is valid, return the payload
        return authPayload;

    } catch (error) {
        console.log("Session verification failed:", error);
        return null;
    }
}
