
import { config } from 'dotenv';
import * as bcrypt from '@node-rs/bcrypt';
import { createTables, createUser, createSlide } from '../lib/db-postgres';
import { User } from '../lib/db.interfaces';

config({ path: '.env.local' });

async function seed() {
  console.log('Starting database seed...');

  try {
    // 1. Reset Database
    console.log('Recreating tables...');
    await createTables();

    // 2. Create Users
    console.log('Creating test users...');
    const saltRounds = 10;

    const adminPassword = await bcrypt.hash('admin', saltRounds);
    const authorPassword = await bcrypt.hash('author', saltRounds);
    const patronPassword = await bcrypt.hash('patron', saltRounds);

    const adminUser = await createUser({
      username: 'Admin',
      email: 'admin@tt.com',
      password: adminPassword,
      displayName: 'Administrator TT',
      role: 'admin',
      avatar: undefined // explicit undefined to trigger NULL handling
    });

    const authorUser = await createUser({
      username: 'Author',
      email: 'author@tt.com',
      password: authorPassword,
      displayName: 'Author A',
      role: 'author',
      avatar: undefined
    });

    const patronUser = await createUser({
      username: 'Patron',
      email: 'patron@tt.com',
      password: patronPassword,
      displayName: 'Patron P',
      role: 'patron',
      avatar: undefined
    });

    console.log('Users created:', {
      admin: adminUser.email,
      author: authorUser.email,
      patron: patronUser.email
    });

    // 3. Create Slides
    console.log('Creating test slides...');

    const testVideoUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'; // Public test HLS URL

    // Slide 1: Public Video
    await createSlide({
        userId: authorUser.id,
        username: authorUser.username,
        avatar: authorUser.avatar || '',
        x: 0,
        y: 0,
        type: 'video',
        access: 'public',
        data: {
            title: 'Public Slide 1',
            hlsUrl: testVideoUrl,
            mp4Url: '', // Changed null to empty string
            poster: '',
            description: 'A public test slide.'
        }
    });

    // Slide 2: Secret Video
    await createSlide({
        userId: authorUser.id,
        username: authorUser.username,
        avatar: authorUser.avatar || '',
        x: 0,
        y: 1,
        type: 'video',
        access: 'secret', // This should trigger the overlay for non-privileged users
        data: {
            title: 'Secret Slide 2',
            hlsUrl: testVideoUrl,
            mp4Url: '', // Changed null to empty string
            poster: '',
            description: 'A secret test slide.'
        }
    });

    // Slide 3: Public HTML
    await createSlide({
        userId: authorUser.id,
        username: authorUser.username,
        avatar: authorUser.avatar || '',
        x: 0,
        y: 2,
        type: 'html',
        access: 'public',
        data: {
            title: 'Public HTML Slide',
            htmlContent: '<div style="padding: 20px; text-align: center;"><h1>Hello World</h1><p>This is a public HTML slide.</p></div>'
        }
    });

    // Slide 4: Secret Video (Another one)
    await createSlide({
        userId: authorUser.id,
        username: authorUser.username,
        avatar: authorUser.avatar || '',
        x: 0,
        y: 3,
        type: 'video',
        access: 'secret',
        data: {
            title: 'Secret Slide 4',
            hlsUrl: testVideoUrl,
            mp4Url: '', // Changed null to empty string
            poster: '',
            description: 'Another secret test slide.'
        }
    });

    console.log('Slides created.');
    console.log('Database seed completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
