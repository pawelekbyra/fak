import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AuthError } from 'next-auth';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

export async function POST(req: Request) {
  const body = await req.json();
  const { login, password } = body;

  if (!login || !password) {
    return NextResponse.json({ success: false, message: 'Missing login or password' }, { status: 400 });
  }

  try {
    // signIn will throw an error if auth fails, which is caught below.
    // The `authorize` function in `auth.ts` returns the full user object on success.
    await signIn('credentials', {
      login,
      password,
      redirect: false,
    });

    // After successful sign-in, we need to fetch the user to return a safe object.
    // This logic is now correct because we are explicitly sanitizing the output.
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: login },
                { username: login }
            ]
        }
    });

    if (!user) {
        // This case should theoretically not be reached if signIn was successful.
        return NextResponse.json({ success: false, message: 'User not found after login' }, { status: 500 });
    }

    // Explicitly create a safe user object to return to the client, omitting the password.
    const userWithoutPassword = {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar || user.image || DEFAULT_AVATAR_URL,
    };

    return NextResponse.json({ success: true, user: userWithoutPassword });

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        default:
          return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
      }
    }

    // This will now catch other errors, like if prisma fails, but not auth errors.
    console.error("Login API Error:", error);
    // Rethrow to let Next.js handle it, which will result in a 500.
    throw error;
  }
}
