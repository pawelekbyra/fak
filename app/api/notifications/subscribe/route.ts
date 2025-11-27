import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { savePushSubscription } from '@/lib/db-postgres';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await req.json();
    const { subscription, isPwaInstalled } = body;

    if (!subscription || !subscription.endpoint) {
        return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await savePushSubscription(userId, subscription, isPwaInstalled || false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
