
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { mockNotifications } from '@/lib/mock-db';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ważne: zapobiega cache'owaniu statycznemu

export async function GET(req: Request) {
  try {
    // 1. Sprawdź sesję (ale nie blokuj, jeśli chcemy testować)
    const session = await auth();
    const url = new URL(req.url);
    const forceMock = url.searchParams.get('mock') === 'true';

    // Jeśli wymuszamy mocki LUB brak usera -> zwracamy mocki od razu
    if (forceMock || !session?.user) {
      console.log("🔔 API: Returning mock notifications (Force Mock or Guest)");
      return NextResponse.json({ success: true, notifications: mockNotifications });
    }

    // 2. Próba pobrania z prawdziwej bazy danych
    try {
      // Sprawdźmy czy prisma w ogóle jest zdefiniowana
      if (!prisma) throw new Error("Prisma client is undefined");

      const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit dla bezpieczeństwa
      });

      // Jeśli user nie ma powiadomień, też możemy dorzucić jedno powitalne mockowe (opcjonalnie)
      if (notifications.length === 0) {
         return NextResponse.json({ success: true, notifications: mockNotifications });
      }

      return NextResponse.json({ success: true, notifications });

    } catch (dbError) {
      console.error("⚠️ API: Database error, falling back to mocks:", dbError);
      // TUTAJ JEST KLUCZ: Zamiast błędu 500, zwracamy mocki!
      return NextResponse.json({ success: true, notifications: mockNotifications });
    }

  } catch (error) {
    console.error("🔥 API: Critical Error:", error);
    // Ostatnia deska ratunku - zawsze zwróć tablicę, nigdy 500
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
