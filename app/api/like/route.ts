import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ably } from '@/lib/ably-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required to like a post.' }, { status: 401 });
  }
  const currentUser = session.user;

  try {
    const { slideId } = await request.json();

    if (!slideId) {
      return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
    }

    const slide = await db.getSlide(slideId);
    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    const result = await db.toggleLike(slideId, currentUser.id!);

    const channel = ably.channels.get(`likes:${slideId}`);
    await channel.publish('update', { likeCount: result.likeCount });

    return NextResponse.json({
      success: true,
      newStatus: result.newStatus,
      likeCount: result.likeCount,
    });

  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
