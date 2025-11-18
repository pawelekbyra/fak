import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import * as db from '@/lib/db';

export async function GET(req: NextRequest) {
    const payload = await verifySession();

    if (!payload || !payload.user) {
        return NextResponse.json({ isLoggedIn: false, user: null });
    }

    // @ts-ignore
    const freshUser = await db.findUserById(payload.user.id);
    if (!freshUser) {
        // This can happen if the user was deleted but the cookie remains.
        return NextResponse.json({ isLoggedIn: false, user: null });
    }
    const { password, ...userPayload } = freshUser;

    return NextResponse.json({ isLoggedIn: true, user: userPayload });
}
