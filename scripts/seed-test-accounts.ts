import { config } from 'dotenv';
import * as bcrypt from '@node-rs/bcrypt';
import { prisma } from '../lib/prisma';

config({ path: '.env.local' });

async function seed() {
  // 0. Safety Check
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SAFETY ERROR: Seed script cannot be run in production!');
    return;
  }

  console.log('Starting database seed (UPSERT mode) with Prisma...');

  try {
    // 1. Upsert Users
    console.log('Upserting test users...');
    const saltRounds = 10;

    const usersToSeed = [
      {
        username: 'Admin',
        email: 'admin@admin.pl',
        passwordPlain: 'admin',
        displayName: 'Administrator TT',
        role: 'admin',
      },
      {
        username: 'Author',
        email: 'autor@autor.pl',
        passwordPlain: 'autor',
        displayName: 'Author A',
        role: 'author',
      },
      {
        username: 'Patron',
        email: 'patron@patron.pl',
        passwordPlain: 'patron',
        displayName: 'Patron P',
        role: 'patron',
      }
    ];

    const createdUsers: Record<string, any> = {};

    for (const u of usersToSeed) {
        const hashedPassword = await bcrypt.hash(u.passwordPlain, saltRounds);

        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                role: u.role,
                displayName: u.displayName,
                username: u.username,
                name: u.displayName, // Sync Name
            },
            create: {
                email: u.email,
                username: u.username,
                password: hashedPassword,
                displayName: u.displayName,
                role: u.role,
                name: u.displayName,
                sessionVersion: 1
            }
        });

        console.log(`✅ User processed: ${u.email}`);
        createdUsers[u.role] = user;
    }

    console.log('Database seed completed successfully (Users only).');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
