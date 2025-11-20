import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await verifySession();
    if (session && session.user) {
      return NextResponse.json({ isLoggedIn: true, user: session.user });
    }
    return NextResponse.json({ isLoggedIn: false, user: null });
  } catch (error) {
    console.error("Failed to verify session:", error);
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
}
