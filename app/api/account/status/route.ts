import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ isLoggedIn: false, user: null });
    }

    const freshUser = await db.findUserById(session.user.id!);
    if (!freshUser) {
        return NextResponse.json({ isLoggedIn: false, user: null });
    }
    const { password, ...userPayload } = freshUser;

    return NextResponse.json({ isLoggedIn: true, user: userPayload });
}
