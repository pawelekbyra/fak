
import { PrismaClient } from '@prisma/client';
import * as bcrypt from '@node-rs/bcrypt';

const prisma = new PrismaClient();

const slides = [
  {
    title: "Poznaj Świat Lamy i Alpaki",
    videoUrl: "https://stream.bunny.net/3582a720-4352-472d-b922-a6327b7c8430/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/34j6QP3.jpeg",
  },
  {
    title: "Innowacyjna Platforma Edukacyjna",
    videoUrl: "https://stream.bunny.net/8390b395-5fa1-4560-84a1-12c44824b081/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/n1yQ37M.jpeg",
  },
  {
    title: "Sztuka i Kreatywność w Harmony",
    videoUrl: "https://stream.bunny.net/41fe1b3a-0e93-4a64-ba8d-29170e5abb07/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/rSCTJmF.jpeg",
  },
  {
    title: "Przygoda z QuantumVerse",
    videoUrl: "https://stream.bunny.net/73f1d3c1-b01c-4b53-b26a-360a875d7422/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/j1v2X3P.jpeg",
  },
  {
    title: "Cyberbezpieczeństwo w Praktyce",
    videoUrl: "https://stream.bunny.net/ca2490b4-1c6f-474d-9669-7c98031d23cb/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/lO7S9z3.jpeg",
  },
  {
    title: "Odkryj Potęgę BioInformatyki",
    videoUrl: "https://stream.bunny.net/77656910-2f95-467f-85f0-63462f6b4052/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/2K1z60R.jpeg",
  },
  {
    title: "Zrównoważony Rozwój z EcoTech",
    videoUrl: "https://stream.bunny.net/3505c8d3-0b1c-43a3-a00c-71b5634568e6/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/4fX8j6S.jpeg",
  },
  {
    title: "Finanse i Inwestycje z FinFuture",
    videoUrl: "https://stream.bunny.net/f6f7b1c4-2d9f-4e3a-8b8a-3e5f2e3f0e1c/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/9v8N7dY.jpeg",
  },
  {
    title: "Kulinarna Podróż z GastroGo",
    videoUrl: "https://stream.bunny.net/1f9b0c6e-8a3a-4f2e-8c3b-9d4f0b2a1a0e/playlist.m3u8",
    thumbnailUrl: "https://i.imgur.com/uT2d5zI.jpeg",
  },
];

async function main() {
  console.log('Seeding database...');

  // 1. Delete old slides
  await prisma.slide.deleteMany({});
  console.log('Deleted all existing slides.');

  // 2. Create author user if it doesn't exist
  let author = await prisma.user.findUnique({
    where: { email: 'author@example.com' },
  });

  if (!author) {
    const hashedPassword = await bcrypt.hash('author123', 10);
    author = await prisma.user.create({
      data: {
        email: 'author@example.com',
        name: 'Author',
        password: hashedPassword,
      },
    });
    console.log('Created author user.');
  } else {
    console.log('Author user already exists.');
  }

  // 3. Insert new slides
  for (const slide of slides) {
    await prisma.slide.create({
      data: {
        ...slide,
        authorId: author.id,
        public: true,
      },
    });
  }
  console.log(`Inserted ${slides.length} slides.`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
