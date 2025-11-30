
import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername, findUserByEmail, getSlides, getComments, addComment } from '@/lib/db-postgres';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get Bot User
    // We assume the bot exists. In a real scenario, we might want to find it by a specific flag.
    // However, Prisma types might not be updated in this environment yet if db push failed.
    // We will try to find "Robot Robert" by username 'robot_robert' or email 'robot@polutek.app'.

    let botUser = await findUserByUsername('robot_robert');
    if (!botUser) {
        // Fallback to finding by email if username differs
        botUser = await findUserByEmail('robot@polutek.app');
    }

    // Auto-create bot user if it doesn't exist
    if (!botUser) {
        try {
            console.log("Bot user not found, creating...");
            // Using createUser from lib/db-postgres.ts which expects specific object
            const { createUser } = await import('@/lib/db-postgres');
            botUser = await createUser({
                username: 'robot_robert',
                displayName: 'Robot Robert',
                email: 'robot@polutek.app',
                password: null, // No password needed
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robert',
                role: 'verified' // Or a specific 'bot' role if available, but 'verified' is good for visibility
            });
            console.log("Bot user created:", botUser.id);
        } catch (err: any) {
            console.error("Failed to create bot user:", err);
             return NextResponse.json({ error: 'Bot user not found and creation failed: ' + err.message }, { status: 500 });
        }
    }

    if (!botUser) {
      return NextResponse.json({ error: 'Bot user not found' }, { status: 404 });
    }

    // 3. Random Action (50/50)
    const action = Math.random() < 0.5 ? 'COMMENT' : 'REPLY';

    // Setup Gemini
    const model = google('gemini-1.5-pro'); // Using 1.5 Pro as likely available and good for Polish

    let resultText = '';
    let targetId = '';
    let parentId: string | null = null;
    let slideId = '';

    if (action === 'COMMENT') {
      // Action A: New Comment on a Slide
      // Get a random recent slide.
      // Since we don't have a "getRandomSlide" function, we get recent ones and pick one.
      const slides = await getSlides({ limit: 20 });
      if (!slides || slides.length === 0) {
        return NextResponse.json({ message: 'No slides to comment on' });
      }

      const randomSlide = slides[Math.floor(Math.random() * slides.length)];
      slideId = randomSlide.id;
      targetId = slideId;

      // Construct Prompt
      const prompt = `
        Jesteś użytkownikiem o imieniu Robot Robert w aplikacji społecznościowej "Polutek" (podobnej do TikTok).
        Twoim zadaniem jest napisać krótki, luźny komentarz pod filmem.

        // @ts-ignore - title might not exist on html slide type in union
        Tytuł filmu: "${(randomSlide.data as any)?.title || 'Bez tytułu'}"
        Opis/Treść: "${JSON.stringify(randomSlide.data || {})}"

        Wytyczne:
        - Pisz po polsku.
        - Styl luźny, internetowy, krótki (maks 2 zdania).
        - Możesz używać emoji.
        - Bądź miły lub zabawny.
      `;

      const { text } = await generateText({
        model,
        prompt,
      });
      resultText = text;

    } else {
      // Action B: Reply to a Comment
      // We need to find a comment that is NOT by the bot.
      // We'll fetch recent slides, then fetch comments for one of them.
      const slides = await getSlides({ limit: 10 });
      if (!slides || slides.length === 0) {
         return NextResponse.json({ message: 'No slides found to look for comments' });
      }

      // Try a few slides to find comments
      let targetComment = null;
      let targetSlideId = '';

      // Shuffle slides to avoid always checking the first one
      const shuffledSlides = slides.sort(() => 0.5 - Math.random());

      for (const slide of shuffledSlides) {
        const { comments } = await getComments(slide.id, { limit: 10 });
        // Filter out bot's own comments and find a suitable one
        const candidates = comments.filter(c => c.authorId !== botUser?.id);

        if (candidates.length > 0) {
          targetComment = candidates[Math.floor(Math.random() * candidates.length)];
          targetSlideId = slide.id;
          break;
        }
      }

      if (!targetComment) {
        // Fallback to commenting if no comments found to reply to
        // We will just return early or force comment action. Let's return message.
        return NextResponse.json({ message: 'No suitable comments found to reply to' });
      }

      slideId = targetSlideId;
      parentId = targetComment.id;
      targetId = parentId;

      // Construct Prompt
      const prompt = `
        Jesteś użytkownikiem o imieniu Robot Robert w aplikacji społecznościowej "Polutek".
        Twoim zadaniem jest odpowiedzieć na komentarz innego użytkownika.

        Treść komentarza użytkownika: "${targetComment.text}"
        Autor komentarza: ${targetComment.author.username || 'Nieznany'}

        Wytyczne:
        - Pisz po polsku.
        - Styl luźny, krótki.
        - Odnieś się do treści komentarza.
        - Bądź pomocny lub zabawny.
      `;

      const { text } = await generateText({
        model,
        prompt,
      });
      resultText = text;
    }

    // 4. Save to Database
    if (resultText) {
       await addComment(slideId, botUser.id, resultText, parentId);
    }

    return NextResponse.json({
      success: true,
      action,
      targetId,
      text: resultText
    });

  } catch (error: any) {
    console.error('Bot Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
