import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Log diagnostyczny dla Vercel
  console.log(`[DIAGNOSTIC] GOOGLE_GENERATIVE_AI_API_KEY present: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}, GITHUB_TOKEN present: ${!!process.env.GITHUB_TOKEN}`);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json({
      status: "ERROR",
      message: "API key is missing on Vercel environment variables.",
      details: "Ensure GOOGLE_GENERATIVE_AI_API_KEY is set."
    }, { status: 500 });
  }

  try {
    // 2. Test nie-streamingowy Gemini
    // Switching to 'gemini-1.5-pro-latest' as 'gemini-1.5-flash' caused a "model not found" error.
    const result = await generateText({
      model: google('gemini-1.5-pro-latest'),
      prompt: 'Odpowiedz jednym słowem: OK',
    });

    // 3. Sukces
    return Response.json({
      status: "SUCCESS",
      message: "Gemini API key works! Full response received.",
      response_text: result.text.trim(),
      model_usage: result.usage,
    }, { status: 200 });
  } catch (error: any) {
    // 4. Błąd (np. zły klucz lub brak uprawnień)
    console.error("[DIAGNOSTIC FATAL]", error.message);
    return Response.json({
      status: "FAILURE",
      message: "Gemini API call failed.",
      details: error.message,
    }, { status: 400 });
  }
}
