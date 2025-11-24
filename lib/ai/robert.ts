import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import fs from 'fs';
import path from 'path';

/**
 * Service to handle Robot Robert's logic.
 * Reads the persona and streams the response from Gemini.
 */
export async function getRobertResponse(messages: any[]) {
  // Check API Key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
  }

  // Load Persona
  const personaPath = path.join(process.cwd(), 'robert-persona.md');
  let system = "Jesteś pomocnym asystentem.";
  try {
    if (fs.existsSync(personaPath)) {
      system = fs.readFileSync(personaPath, 'utf-8');
    } else {
      console.warn('Persona file not found at:', personaPath);
    }
  } catch (err) {
    console.error("Error reading persona:", err);
  }

  // Call AI
  // Note: convertToCoreMessages safely converts UI messages to the CoreMessage format expected by streamText
  const coreMessages = convertToCoreMessages(messages);

  const result = streamText({
    model: google('gemini-1.5-pro'),
    system,
    messages: coreMessages,
  });

  return result;
}
