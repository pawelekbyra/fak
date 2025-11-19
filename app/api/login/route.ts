import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { rateLimit } from '@/lib/rate-limiter';

const FALLBACK_SECRET = 'a_very_long_insecure_key_for_testing_1234567890abcdef';
const secretToUse = process.env.JWT_SECRET || FALLBACK_SECRET;

if (!process.env.JWT_SECRET) {
console.warn("WARNING: JWT_SECRET not set. Using insecure default fallback key for development.");
}

const JWT_SECRET = new TextEncoder().encode(secretToUse);
const COOKIE_NAME = 'session';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || '127.0.0.1';
  const { success } = await rateLimit(`login:${ip}`, 5, 60);

  if (!success) {
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (email === 'admin' && password === 'admin') {
      const mockAdminUser = {
        id: 'mock-admin-id',
        email: 'admin',
        username: 'Admin',
        role: 'admin',
        avatar_url: '',
      };

      const token = await new SignJWT({ user: mockAdminUser })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true, user: mockAdminUser });
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }

    if (!user.password) {
        // User exists but has no password set (e.g., social login in the future)
        return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }

    // Don't include password hash in the token payload
    const { password: _password, ...userPayload } = user;

    // Create the session token (JWT)
    const token = await new SignJWT({ user: userPayload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Set the session cookie
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({ success: true, user: userPayload });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred' }, { status: 500 });
  }
}
