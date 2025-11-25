import {
  streamText,
  UIMessage,
  convertToCoreMessages,
  tool,
  stepCountIs,
} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
    }

    const personaPath = path.join(process.cwd(), 'lolek-persona.md');
    let system = "Jesteś pomocnym asystentem o imieniu Lolek."; // Fallback
    try {
      if (fs.existsSync(personaPath)) {
        system = fs.readFileSync(personaPath, 'utf-8');
      } else {
        console.warn('Persona file not found at:', personaPath);
      }
    } catch (err) {
      console.error("Error reading persona:", err);
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google('gemini-1.5-pro-preview'), // Using the latest model
      system,
      messages: convertToCoreMessages(messages),
      stopWhen: stepCountIs(5), // Enable multi-step tool calls
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            // Simulated weather data
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
        convertFahrenheitToCelsius: tool({
          description: 'Convert a temperature in fahrenheit to celsius',
          inputSchema: z.object({
            temperature: z
              .number()
              .describe('The temperature in fahrenheit to convert'),
          }),
          execute: async ({ temperature }) => {
            const celsius = Math.round((temperature - 32) * (5 / 9));
            return {
              celsius,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();

  } catch (error: any) {
    console.error('Error in /api/lolek:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
