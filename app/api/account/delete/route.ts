import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { sendAccountDeletedEmail } from '@/lib/email';

const COOKIE_NAME = 'session';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { confirm_text } = await request.json();

    if (confirm_text !== 'USUWAM KONTO') {
      return NextResponse.json({ success: false, message: 'Confirmation text is incorrect.' }, { status: 400 });
    }

    // Get user email before deletion for notification
    const user = await db.findUserById(payload.user.id);
    const userEmail = user?.email;

    const wasDeleted = await db.deleteUser(payload.user.id);

    if (!wasDeleted) {
        return NextResponse.json({ success: false, message: 'User not found or could not be deleted.' }, { status: 404 });
    }

    if (userEmail) {
      // Fire and forget email
      sendAccountDeletedEmail(userEmail).catch(err => console.error('Failed to send deletion email', err));
    }

    // Clear the session cookie to log the user out
    cookies().delete(COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Twoje konto zostało usunięte. Zostałeś wylogowany.',
    });

  } catch (error) {
    console.error('Error in account delete API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
