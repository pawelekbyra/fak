import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const payload = await verifySession();
  if (!payload || !payload.user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = payload.user.id;

  try {
    const { commentId, voteType } = await request.json();

    if (!commentId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ success: false, message: 'commentId and voteType (upvote/downvote) are required' }, { status: 400 });
    }

    const result = await db.toggleCommentLike(commentId, userId, voteType);

    return NextResponse.json({
      success: true,
      newStatus: result.newStatus,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount,
    });

  } catch (error) {
    console.error('Error toggling comment vote:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
