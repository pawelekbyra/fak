
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data fix...');

  // 1. Find or create the "Author" user
  const authorUser = await prisma.user.upsert({
    where: { username: 'Author' },
    update: {},
    create: {
      username: 'Author',
      email: 'author@example.com', // Dummy email required by unique constraint
      displayName: 'Główny Twórca',
      role: 'admin', // Or 'creator' if that's the role
      avatarUrl: 'https://i.pravatar.cc/150?u=Author', // Placeholder
    },
  });

  console.log(`Target Author ID: ${authorUser.id}`);

  // 2. Update ALL slides to belong to this user
  const updateResult = await prisma.slide.updateMany({
    data: {
      userId: authorUser.id,
    },
  });

  console.log(`Updated ${updateResult.count} slides to belong to ${authorUser.username} (${authorUser.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
