export const mockNotifications = [
  {
    id: 'mock-1',
    userId: 'current-user',
    type: 'system',
    text: 'Witaj w Polutek! 🎥 To jest przykładowe powiadomienie.',
    link: null,
    createdAt: new Date().toISOString(),
    read: false,
    fromUserId: 'system',
    fromUser: {
      id: 'system',
      displayName: 'System',
      avatar: '/icons/icon-192x192.png'
    }
  },
  {
    id: 'mock-2',
    userId: 'current-user',
    type: 'like',
    text: 'Użytkownik Pola polubił Twój film.',
    link: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
    fromUserId: 'u2',
    fromUser: {
      id: 'u2',
      displayName: 'Pola',
      avatar: 'https://i.pravatar.cc/150?u=pola'
    }
  },
  {
    id: 'mock-3',
    userId: 'current-user',
    type: 'comment',
    text: 'Użytkownik Jan skomentował Twój film: "Sztos! 🔥"',
    link: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    fromUserId: 'u3',
    fromUser: {
      id: 'u3',
      displayName: 'Jan',
      avatar: 'https://i.pravatar.cc/150?u=jan'
    }
  },
  {
    id: 'mock-4',
    userId: 'current-user',
    type: 'follow',
    text: 'Użytkownik Marek zaczął Cię obserwować.',
    link: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
    fromUserId: 'u4',
    fromUser: {
      id: 'u4',
      displayName: 'Marek',
      avatar: 'https://i.pravatar.cc/150?u=marek'
    }
  }
];
