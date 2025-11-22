
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use singleton instance

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing user ID' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        image: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const slides = await prisma.slide.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        content: true,
      },
    });

    const formattedSlides = slides.map((slide) => {
      let title = slide.title || 'Untitled';
      let thumbnailUrl = slide.thumbnailUrl || '/placeholder.jpg';

      // Fallback: Parse content JSON if title or thumbnail are missing
      if ((!slide.title || !slide.thumbnailUrl) && slide.content) {
        try {
          const parsedContent = JSON.parse(slide.content);
          if (!title || title === 'Untitled') {
             title = parsedContent.title || 'Untitled';
          }
          if (!thumbnailUrl || thumbnailUrl === '/placeholder.jpg') {
             thumbnailUrl = parsedContent.thumbnailUrl || parsedContent.cover || '/placeholder.jpg';
          }
        } catch (e) {
          // Ignore parsing error
        }
      }

      return {
        id: slide.id,
        title,
        thumbnailUrl,
      };
    });

    const responseData = {
      id: user.id,
      username: user.displayName || user.username || 'Użytkownik',
      avatarUrl: user.avatarUrl || user.image || 'https://i.pravatar.cc/150?u=' + user.id,
      bio: user.bio || "Twórca wideo",
      slides: formattedSlides,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching author profile:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
  // No disconnect in serverless environment
}
