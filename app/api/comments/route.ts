import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slideId = searchParams.get('slideId');
  const session = await verifySession();
  const currentUserId = session?.user?.id;

  if (!slideId) {
    return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
  }

  try {
    const comments = await db.getCommentsForSlide(slideId, currentUserId);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// Funkcja POST zostaje usunięta, ponieważ cała logika dodawania komentarzy
// jest teraz obsługiwana przez Server Action w `lib/comment-actions.ts`.
// To upraszcza architekturę i eliminuje potrzebę utrzymywania dwóch oddzielnych ścieżek.
