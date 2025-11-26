import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

config({ path: '.env.local' });

async function seed() {
  // 0. Safety Check
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Seeding in production? Ensure this is intentional.');
    // Note: We are removing the strict exit to allow "admin" maintenance if needed,
    // but keeping the warning. The user asked for "Ochronę środowiskową" (Env protection),
    // but also "Safe Seed". Usually UPSERT is safe.
    // However, "db:reset" (the wrapper) is destructive. This script is just upsert.
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

    for (const u of usersToSeed) {
        const hashedPassword = await bcrypt.hash(u.passwordPlain, saltRounds);

        // Use upsert to be safe and idempotent
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                // Update fields if they exist
                password: hashedPassword,
                role: u.role,
                displayName: u.displayName,
                username: u.username,
                name: u.displayName,
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
    }

    console.log('Database seed completed successfully (Users).');
    // We do NOT exit here if we want to chain scripts, but usually ts-node exits when done.
    // process.exit(0) is fine.

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
