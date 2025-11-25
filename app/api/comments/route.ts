import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { sanitize } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limiter';
import { ably } from '@/lib/ably-server';
import { prisma } from '@/lib/prisma'; // Import prisma for direct checks if needed, but we should try to use db layer

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slideId = searchParams.get('slideId');
  const cursor = searchParams.get('cursor') || undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const sortBy = searchParams.get('sortBy') as 'latest' | 'top' | null;

  if (!slideId) {
    return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
  }

  try {
    const { comments, nextCursor } = await db.getComments(slideId, { limit, cursor, sortBy: sortBy || 'latest' });
    return NextResponse.json({ success: true, comments, nextCursor });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required to comment.' }, { status: 401 });
  }
  const currentUser = session.user;

  const { success } = await rateLimit(`comment:${currentUser.id}`, 3, 30);

  if (!success) {
    return NextResponse.json({ success: false, message: 'commentRateLimit' }, { status: 429 });
  }

  try {
    const { slideId, text, parentId } = await request.json();

    if (!slideId || !text) {
      return NextResponse.json({ success: false, message: 'slideId and text are required' }, { status: 400 });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ success: false, message: 'Comment text cannot be empty.' }, { status: 400 });
    }

    const slide = await db.getSlide(slideId);
    if (!slide) {
        return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    const sanitizedText = sanitize(text.trim());
    if (sanitizedText.length === 0) {
        return NextResponse.json({ success: false, message: 'Comment text cannot be empty after sanitization.' }, { status: 400 });
    }

    // Pass parentId to db.addComment
    const newComment = await db.addComment(slideId, currentUser.id!, sanitizedText, parentId || null);

    const channel = ably.channels.get(`comments:${slideId}`);
    await channel.publish('new-comment', newComment);

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

  } catch (error: any) {
    console.error('Error posting comment:', error);
    // Return a JSON object with message property
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }
    const currentUser = session.user;

    try {
      const { commentId } = await request.json();

      if (!commentId) {
        return NextResponse.json({ success: false, message: 'commentId is required' }, { status: 400 });
      }

      // Secure Delete: explicit check before calling DB delete
      // Although db.deleteComment has a check, adding a redundant check here as requested by prompt "In app/api/comments/route.ts ... check if session.user.id == authorId"

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true }
      });

      if (!comment) {
        return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
      }

      if (comment.authorId !== currentUser.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }

      await db.deleteComment(commentId, currentUser.id!);

      return NextResponse.json({ success: true });

    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }
