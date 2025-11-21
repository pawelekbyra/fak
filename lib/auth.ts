import { auth } from '@/auth';
import { User } from './db.interfaces';
import { cookies } from 'next/headers';

// Keep exports for backward compatibility if needed, but COOKIE_NAME might change with NextAuth
export const COOKIE_NAME = 'authjs.session-token'; // Example, varies by config/env

export interface AuthPayload {
    user: Omit<User, 'password'>;
    // iat and exp are not directly exposed by auth() session usually,
    // but for compatibility we can mock them or retrieve from token if using jwt callback
    iat: number;
    exp: number;
}

// Helper to set a session cookie manually if needed (as per safety requirements)
// Ensures path is set to root.
export async function setSessionCookie(name: string, value: string, expires?: Date) {
    cookies().set(name, value, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expires
    });
}

// Wrapper function to replace the old verifySession logic with NextAuth's auth()
export async function verifySession(): Promise<AuthPayload | null> {
    const session = await auth();

    if (!session || !session.user) {
        return null;
    }

    // Map NextAuth session user to the application's User interface
    // Thanks to module augmentation in types/next-auth.d.ts, TypeScript now knows about these fields.

    const user: Omit<User, 'password'> = {
        id: session.user.id,
        email: session.user.email || '',
        role: (session.user.role as User['role']) || 'user',
        displayName: session.user.displayName || session.user.name || '',
        avatar: session.user.avatar || session.user.image || '',
        username: session.user.username || '',
        sessionVersion: session.user.sessionVersion || 1,
        // Fields required by User interface but potentially missing in session:
        emailConsent: false, // Default fallback
        emailLanguage: 'pl', // Default fallback
    };

    // We return a structure compatible with AuthPayload
    return {
        user: user,
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + (30 * 24 * 60 * 60) // Mock expiration
    };
}
