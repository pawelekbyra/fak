import { auth } from '@/auth';
import { User } from './db.interfaces';

// Keep exports for backward compatibility if needed, but COOKIE_NAME might change with NextAuth
export const COOKIE_NAME = 'authjs.session-token'; // Example, varies by config/env

export interface AuthPayload {
    user: Omit<User, 'password'>;
    // iat and exp are not directly exposed by auth() session usually,
    // but for compatibility we can mock them or retrieve from token if using jwt callback
    iat: number;
    exp: number;
}

// Wrapper function to replace the old verifySession logic with NextAuth's auth()
export async function verifySession(): Promise<AuthPayload | null> {
    const session = await auth();

    if (!session || !session.user) {
        return null;
    }

    // Map NextAuth session user to the application's User interface
    // session.user has id, role, name, email, image.
    // User interface requires: id, email, username (we added it to token), role.
    // We need to ensure types match.

    // The 'user' object from session might not have all fields if we didn't add them in callbacks.
    // In auth.ts, we added id, role, username to token, then to session.

    const user: any = {
        id: session.user.id,
        email: session.user.email || '',
        role: (session.user as any).role || 'user',
        // We mapped 'name' to 'displayName' in some places, but let's check what we have.
        displayName: session.user.name || '',
        avatar: session.user.image || '',
        // username was added to session in auth.ts
        username: (session.user as any).username || '',
        sessionVersion: 1 // Mocked as we don't carry it in session always, or we should fetch from DB if critical
    };

    // We return a structure compatible with AuthPayload
    return {
        user: user,
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + (30 * 24 * 60 * 60) // Mock expiration
    };
}
