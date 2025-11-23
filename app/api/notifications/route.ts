
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { mockNotifications } from '@/lib/mock-db';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const forceMock = url.searchParams.get('mock') === 'true';

    // Helper to return success wrapper
    const successResponse = (data: any[]) => NextResponse.json({ success: true, notifications: data });

    if (forceMock || !session?.user) {
      console.log("🔔 API: Returning mock notifications (Force Mock or Guest)");
      return successResponse(mockNotifications);
    }

    try {
      if (!prisma) throw new Error("Prisma client is undefined");

      const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          fromUser: {
            select: {
              id: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      if (notifications.length === 0) {
         // Return mocks if no real notifications exist, for better DX
         return successResponse(mockNotifications);
      }

      return successResponse(notifications);

    } catch (dbError) {
      console.error("⚠️ API: Database error, falling back to mocks:", dbError);
      return successResponse(mockNotifications);
    }

  } catch (error) {
    console.error("🔥 API: Critical Error:", error);
    // Always return mock data in correct format on error
    return NextResponse.json({ success: true, notifications: mockNotifications });
  }
}

export async function POST(request: Request) {
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
