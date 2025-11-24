import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const personaPath = path.join(process.cwd(), 'robert-persona.md');
    
    let system = "Jesteś pomocnym asystentem.";
    if (fs.existsSync(personaPath)) {
       system = fs.readFileSync(personaPath, 'utf-8');
    } else {
       console.error('Persona file not found at:', personaPath);
    }

    const result = streamText({
      model: google('gemini-3-pro-preview'), 
      system,
      messages: convertToModelMessages(messages),
    });

    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Error in /api/robert:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
