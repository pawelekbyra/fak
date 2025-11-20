import { config } from 'dotenv';
import { prisma } from '../lib/prisma';

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
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
        },
        {
            title: "Elephant Dream",
            mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            hls: null,
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg"
        },
        {
            title: "For Bigger Blazes",
            mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            hls: null,
            poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg"
        }
    ];

    // 3. Create Slides
    // We use a loop and create them. Since we don't have unique constraints on Title,
    // we can't easily "upsert" based on title without a custom where.
    // We will delete existing slides for this author to prevent duplication on reset,
    // OR we just create them. Since this is usually run after db:reset, it's fine.
    // But to be "Safe Seed", we should check if they exist.

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
            console.log(`Skipping existing slide: ${slideTitle}`);
            continue;
        }

        // Construct the JSON content structure expected by the app
        // Based on lib/db-postgres.ts structure: { access, data: { title, mp4Url, ... }, avatar }
        const contentJson = JSON.stringify({
            access: 'public',
            avatar: author.avatar || '', // Should be empty or set
            data: {
                title: video.title,
                mp4Url: video.mp4,
                hlsUrl: video.hls, // Can be null
                poster: video.poster,
                description: `Seeded video: ${video.title}`
            }
        });

        await prisma.slide.create({
            data: {
                userId: author.id,
                username: author.username, // Denormalized
                title: video.title,
                content: contentJson,
                slideType: 'video',
                x: 0,
                y: index, // Vertical stack
                // Fill standard fields too for compatibility if we ever switch back
                videoUrl: video.mp4,
                thumbnailUrl: video.poster,
                public: true
            }
        });

        console.log(`✅ Created slide: ${slideTitle}`);
    }

    console.log('Slides seeded successfully.');

  } catch (error) {
    console.error('Error seeding slides:', error);
    process.exit(1);
  }
}

seedSlides();
