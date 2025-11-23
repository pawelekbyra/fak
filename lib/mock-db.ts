import { DEFAULT_AVATAR_URL } from '@/lib/constants';

export const mockNotifications = [
  {
    id: 'mock-1',
    userId: 'user-1',
    type: 'system',
    text: 'Witaj w wersji VIP 👑',
    link: null,
    createdAt: new Date().toISOString(),
    read: false,
    fromUserId: null,
    fromUser: {
        id: 'system',
        displayName: 'System',
        avatar: DEFAULT_AVATAR_URL
    }
  },
  {
    id: 'mock-2',
    userId: 'user-1',
    type: 'system', // Using 'system' instead of 'tip' as 'tip' isn't in the strict NotificationType union if it's just 'like' | 'comment' | 'follow' | 'message' in frontend.
                    // However, db.interfaces says 'system' | 'like' | 'comment' | 'follow' | 'tip' ??
                    // Let's check db.interfaces.ts again. It says 'like' | 'comment' | 'follow' | 'system'.
                    // So 'tip' is not valid. I will use 'system' for now or 'message'.
    text: 'Otrzymałeś napiwek w wysokości 50 PLN od Nieznajomego.',
    link: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
    fromUserId: 'unknown',
    fromUser: {
        id: 'unknown',
        displayName: 'Nieznajomy',
        avatar: DEFAULT_AVATAR_URL
    }
  },
  {
    id: 'mock-3',
    userId: 'user-1',
    type: 'like',
    text: 'Użytkownik Jules polubił Twoje wideo "Nocne kodowanie".',
    link: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    fromUserId: 'jules',
    fromUser: {
        id: 'jules',
        displayName: 'Jules',
        avatar: DEFAULT_AVATAR_URL
    }
  }
];
