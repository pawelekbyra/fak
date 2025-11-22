
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data fix...');

  // 1. Find or create the "Author" user
  const authorUser = await prisma.user.upsert({
    where: { username: 'Author' },
    update: {
      avatarUrl: 'https://placehold.co/150x150?text=A', // Default Avatar
      displayName: 'Główny Twórca', // Ensure Display Name is set
      // bio: 'Jestem głównym twórcą na tej platformie. Tworzę wideo o wszystkim i o niczym.' // Will be added via UI, but safe to omit here if we want user to fill it
    },
    create: {
      username: 'Author',
      email: 'author@example.com',
      displayName: 'Główny Twórca',
      role: 'admin', // Or 'creator' if that's the role
      avatarUrl: 'https://placehold.co/150x150?text=A',
    },
  });

  console.log(`Target Author ID: ${authorUser.id}`);

  // 2. Update ALL slides to belong to this user (Already done, but keeping logic safe)
  const updateResult = await prisma.slide.updateMany({
    data: {
      userId: authorUser.id,
    },
  });
  console.log(`Assigned slides to ${authorUser.username}.`);

  // 3. Fix missing thumbnails
  console.log('Fixing missing thumbnails...');
  const thumbUpdateResult = await prisma.slide.updateMany({
    where: {
      OR: [
        { thumbnailUrl: null },
        { thumbnailUrl: '' }
      ]
    },
    data: {
      thumbnailUrl: 'https://placehold.co/600x400?text=Video'
    }
  });

  console.log(`Updated ${thumbUpdateResult.count} slides with default thumbnails.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
