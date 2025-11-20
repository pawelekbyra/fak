import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from '@node-rs/bcrypt';
import { signIn } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing login or password' },
        { status: 400 }
      );
    }

    // 1. Hybrid Lookup (Email OR Username)
    let user = null;
    if (login.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: login } });
    } else {
      user = await prisma.user.findUnique({ where: { username: login } });
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Verify Password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Prepare User Object (Safe)
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      displayName: user.displayName || user.name, // Fallback
      username: user.username,
      role: user.role,
      avatar: user.avatar || user.image, // Fallback
      // Add other necessary fields for Context
    };

    // 4. Log User In (Set Session)
    // We use signIn to establish the NextAuth session.
    // We wrap it to prevent the default redirect behavior from interfering with our JSON response.
    try {
       await signIn('credentials', {
         login,
         password,
         redirect: false
       });
    } catch (err) {
      // NextAuth v5 throws a Redirect error even when redirect: false on server-side in some cases?
      // Or if successful it might just return.
      // If it throws a redirect error, we catch it.
      if (isRedirectError(err)) {
         // This means sign in was successful and tried to redirect.
         // We swallow the redirect error and return our JSON.
      } else {
         // Real error
         console.error("SignIn error:", err);
         throw err;
      }
    }

    // 5. Return Success JSON
    return NextResponse.json({ success: true, user: userWithoutPassword });

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
