import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Notifications for Patron...');

  const patronEmail = 'patron@patron.pl';
  const patronUsername = 'Patron';

  // 1. Znajdź lub stwórz użytkownika "Patron"
  let user = await prisma.user.findUnique({
    where: { email: patronEmail },
  });

  if (!user) {
    console.log(`Creating user ${patronUsername}...`);
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email: patronEmail,
        username: patronUsername,
        displayName: patronUsername,
        password: hashedPassword,
        role: 'PATRON', // Correct case based on user instructions/schema
        emailConsent: true,
        emailLanguage: 'pl',
        avatar: 'https://i.pravatar.cc/150?u=patron',
      },
    });
  } else {
      console.log(`User ${patronUsername} found.`);
      // Ensure role is PATRON just in case
      if (user.role !== 'PATRON') {
          await prisma.user.update({
              where: { id: user.id },
              data: { role: 'PATRON' }
          });
      }
  }

  // 2. Wyczyść stare powiadomienia
  console.log('Cleaning old notifications...');
  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  // Helper to find or create a sender (optional, but good for realism)
  const getSender = async (username: string) => {
      let sender = await prisma.user.findUnique({ where: { username }});
      if (!sender) {
          const hashedPassword = await bcrypt.hash('password123', 10);
          sender = await prisma.user.create({
              data: {
                  username,
                  email: `${username.toLowerCase()}@example.com`,
                  displayName: username,
                  password: hashedPassword,
                  avatar: `https://i.pravatar.cc/150?u=${username}`,
              }
          });
      }
      return sender;
  };

  const kasia = await getSender('Kasia');
  const marek = await getSender('Marek');
  const basia = await getSender('Basia');


  // 3. Stwórz Mocki
  console.log('Creating new notifications...');

  const notifications = [
    {
      type: 'system',
      text: 'Witamy Patrona w nowej wersji aplikacji Ting Tong! Sprawdź panel twórcy.',
      read: false,
      link: '/admin', // Logical link for a system msg
      fromUserId: null,
    },
    {
      type: 'like',
      text: 'Użytkownik @Kasia polubił Twój najnowszy slajd.',
      read: false,
      link: '/slide/mock-slide-id',
      fromUserId: kasia.id,
    },
    {
      type: 'comment',
      text: "Marek skomentował: 'Dzięki za ten materiał, bardzo pomocny!'.",
      read: true,
      link: '/slide/mock-slide-id?commentId=123',
      fromUserId: marek.id,
    },
    {
      type: 'follow',
      text: 'Nowy obserwujący: Basia zaczęła Cię obserwować.',
      read: false,
      link: '/profile/basia',
      fromUserId: basia.id,
    },
  ];

  for (const note of notifications) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: note.type,
        text: note.text,
        read: note.read,
        link: note.link,
        fromUserId: note.fromUserId,
      },
    });
  }

  console.log('✅ Notifications seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
