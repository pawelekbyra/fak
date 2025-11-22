
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = session.user.id!;

  try {
    let notifications = await db.getNotifications(userId);
    let unreadCount = await db.getUnreadNotificationCount(userId);

    // Force Mock notifications if empty (as per user request for testing UI)
    // Removed NODE_ENV check to satisfy "chce zobaczyc mockowe powiadomienia"
    if (!notifications || notifications.length === 0) {
        notifications = [
            {
                id: 'mock-1',
                userId: userId,
                type: 'system',
                text: 'Witaj w Ting Tong! To jest przykładowe powiadomienie systemowe.',
                link: null,
                fromUserId: null,
                read: false,
                createdAt: new Date(),
                fromUser: null
            },
            {
                id: 'mock-2',
                userId: userId,
                type: 'like',
                text: 'Użytkownik Patron polubił Twój film.',
                link: null,
                fromUserId: 'mock-patron',
                read: false,
                createdAt: new Date(Date.now() - 3600000), // 1 hour ago
                fromUser: {
                    id: 'mock-patron',
                    username: 'Patron',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock-patron',
                    displayName: 'Patron'
                } as any
            },
            {
                id: 'mock-3',
                userId: userId,
                type: 'comment',
                text: 'Użytkownik Twórca skomentował Twój film: "Super robota!"',
                link: null,
                fromUserId: 'mock-creator',
                read: true,
                createdAt: new Date(Date.now() - 7200000), // 2 hours ago
                fromUser: {
                    id: 'mock-creator',
                    username: 'Twórca',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock-creator',
                    displayName: 'Twórca'
                } as any
            },
            {
                id: 'mock-4',
                userId: userId,
                type: 'follow',
                text: 'Użytkownik Admin zaczął Cię obserwować.',
                link: null,
                fromUserId: 'mock-admin',
                read: true,
                createdAt: new Date(Date.now() - 86400000), // 1 day ago
                fromUser: {
                    id: 'mock-admin',
                    username: 'Admin',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock-admin',
                    displayName: 'Admin'
                } as any
            }
        ];
        unreadCount = 2; // Matches the two 'read: false' mocks above
    }

    return NextResponse.json({ success: true, notifications, unreadCount }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }
    const userId = session.user.id!;

    const { subscription, isPwaInstalled } = await request.json();

    try {
        await db.savePushSubscription(userId, subscription, isPwaInstalled);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
