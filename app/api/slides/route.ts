import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 5;

    const session = await verifySession();
    const currentUserId = session?.user?.id;

    const slidesRaw = await prisma.slides.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        users: {
            select: {
                avatar: true,
            }
        }
      },
    });

    const slides = slidesRaw.map(slide => {
        const { likes, comments, users, slideType, content, createdAt, ...rest } = slide;
        return {
            ...rest,
            avatar: users?.avatar,
            type: slideType,
            createdAt: createdAt ? new Date(createdAt).getTime() : 0,
            initialLikes: likes.length,
            initialComments: comments.length,
            isLiked: currentUserId ? likes.some(like => like.userId === currentUserId) : false,
            data: JSON.parse(content || '{}'),
        }
    });


    let nextCursor: string | null = null;
    if (slides.length === limit) {
      nextCursor = slides[slides.length - 1].id;
    }

    return NextResponse.json({
      slides,
      nextCursor,
    });
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}