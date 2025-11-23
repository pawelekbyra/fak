import { config } from 'dotenv';
import { prisma } from '../lib/prisma';
import { AccessLevel } from '@prisma/client';

config({ path: '.env.local' });

async function seedSlides() {
  console.log('Starting Slide Seeding...');

  try {
    // 1. Find the Author
    const authorEmail = 'autor@autor.pl';
    const author = await prisma.user.findUnique({
      where: { email: authorEmail },
    });

    if (!author) {
      console.error(`❌ Author not found (${authorEmail}). Run seed-test-accounts.ts first.`);
      process.exit(1);
    }

    console.log(`Found author: ${author.displayName} (${author.id})`);

    // 2. Define External Video Links (Safe for Vercel, hosted externally)
    const videos = [
        {
            title: "Big Buck Bunny",
            mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            hls: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Example HLS
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
            accessLevel: 'PUBLIC' as AccessLevel
        },
        {
            title: "Elephant Dream",
            mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            hls: null,
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
            accessLevel: 'SECRET_PATRON' as AccessLevel
        },
        {
            title: "For Bigger Blazes",
            mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            hls: null,
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
            accessLevel: 'SECRET_PWA' as AccessLevel
        }
    ];

    // 3. Create Slides
    for (const [index, video] of videos.entries()) {
        const slideTitle = video.title;

        // Check if slide exists for this author with this title
        const existing = await prisma.slide.findFirst({
            where: {
                userId: author.id,
                title: slideTitle
            }
        });

        if (existing) {
             // If access level changed, we might want to update it.
             if (existing.accessLevel !== video.accessLevel) {
                 await prisma.slide.update({
                     where: { id: existing.id },
                     data: { accessLevel: video.accessLevel }
                 });
                 console.log(`Updated access level for ${slideTitle} to ${video.accessLevel}`);
             } else {
                 console.log(`Skipping existing slide: ${slideTitle}`);
             }
             continue;
        }

        // Construct the JSON content structure expected by the app
        const contentJson = JSON.stringify({
            avatar: author.avatar || '',
            data: {
                title: video.title,
                mp4Url: video.mp4,
                hlsUrl: video.hls,
                poster: video.poster,
                description: `Seeded video: ${video.title} (${video.accessLevel})`
            }
        });

        await prisma.slide.create({
            data: {
                userId: author.id,
                username: author.username,
                title: video.title,
                content: contentJson,
                slideType: 'video',
                accessLevel: video.accessLevel,
                x: 0,
                y: index,
                videoUrl: video.mp4,
                thumbnailUrl: video.poster,
                public: video.accessLevel === 'PUBLIC'
            }
        });

        console.log(`✅ Created slide: ${slideTitle} with access: ${video.accessLevel}`);
    }

    console.log('Slides seeded successfully.');

  } catch (error) {
    console.error('Error seeding slides:', error);
    process.exit(1);
  }
}

seedSlides();
