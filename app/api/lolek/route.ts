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
      model: google('gemini-3-pro-preview'),
      system,
      messages: convertToCoreMessages(messages),
      stopWhen: stepCountIs(5), // Enable multi-step tool calls
      tools: {
        getVercelLogs: tool({
          description: 'Pobierz ostatnie logi błędów z produkcji Vercel, aby zdiagnozować przyczynę awarii.',
          inputSchema: z.object({
            limit: z.number().optional().describe('Liczba logów do pobrania (domyślnie 5)'),
          }),
          execute: async ({ limit = 5 }) => {
            const token = process.env.VERCEL_API_TOKEN;
            const projectId = process.env.VERCEL_PROJECT_ID;

            if (!token || !projectId) {
              return { error: 'Brak konfiguracji Vercel (Token/ProjectID) w zmiennych środowiskowych.' };
            }

            try {
              // 1. Pobierz ostatni deployment
              const deploymentsRes = await fetch(
                `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&state=READY`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const deploymentsData = await deploymentsRes.json();
              const deploymentId = deploymentsData.deployments?.[0]?.uid;

              if (!deploymentId) return { error: 'Nie znaleziono aktywnego wdrożenia.' };

              // 2. Pobierz logi błędów dla tego deploymentu
              const logsRes = await fetch(
                `https://api.vercel.com/v2/now/deployments/${deploymentId}/events?limit=${limit}&q=error`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const logs = await logsRes.json();

              return {
                status: 'success',
                deploymentId,
                logs: logs.length > 0 ? logs : 'Brak błędów w ostatnich logach.'
              };
            } catch (error: any) {
              return { error: `Błąd podczas łączenia z Vercel: ${error.message}` };
            }
          },
        }),
        delegateTaskToJules: tool({
          description: 'Zleć zadanie programistyczne agentowi Jules (np. naprawę błędu na podstawie logów).',
          inputSchema: z.object({
            taskDescription: z.string().describe('Szczegółowy opis zadania, w tym treść błędu z logów jeśli dostępna.'),
            repoName: z.string().describe('Nazwa repozytorium GitHub (np. pawelekbyra/fak).'),
          }),
          execute: async ({ taskDescription, repoName }) => {
            const apiKey = process.env.JULES_API_KEY;
            if (!apiKey) return { error: 'Brak klucza API Julesa.' };

            try {
              // Symulacja wywołania API Julesa (dostosuj endpoint do oficjalnej dokumentacji jeśli inna)
              const response = await fetch('https://jules.googleapis.com/v1alpha/sessions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': apiKey,
                },
                body: JSON.stringify({
                  prompt: taskDescription,
                  sourceContext: {
                    source: `sources/github/${repoName}`,
                    githubRepoContext: { startingBranch: "main" }
                  },
                  automationMode: "AUTO_CREATE_PR"
                })
              });

              if (!response.ok) throw new Error(`Jules API Error: ${response.statusText}`);
              const data = await response.json();

              return {
                status: 'Zadanie zlecone',
                message: `Jules rozpoczął pracę nad: "${taskDescription}". Oczekuj na Pull Request.`,
                sessionId: data.name || 'unknown'
              };
            } catch (error: any) {
              return { error: `Nie udało się zlecić zadania: ${error.message}` };
            }
          },
        }),
        setVercelEnvVar: tool({
          description: 'Ustawia lub aktualizuje zmienną środowiskową w projekcie Vercel.',
          inputSchema: z.object({
            key: z.string().describe('Nazwa zmiennej środowiskowej.'),
            value: z.string().describe('Wartość zmiennej środowiskowej.'),
            target: z.enum(['production', 'preview', 'development']).describe('Środowisko docelowe.'),
          }),
          execute: async ({ key, value, target }) => {
            const token = process.env.VERCEL_API_TOKEN;
            const projectId = process.env.VERCEL_PROJECT_ID;
            if (!token || !projectId) {
              return { error: 'Brak konfiguracji Vercel (Token/ProjectID).' };
            }

            try {
              const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  key,
                  value,
                  type: 'encrypted',
                  target: [target],
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Vercel API Error: ${errorData.error.message}`);
              }

              return { status: 'success', message: `Zmienna ${key} została pomyślnie ustawiona dla środowiska ${target}.` };
            } catch (error: any) {
              return { error: `Nie udało się ustawić zmiennej: ${error.message}` };
            }
          },
        }),
        purgeVercelCache: tool({
          description: 'Czyści pamięć podręczną (Data Cache) dla całego projektu Vercel.',
          inputSchema: z.object({}),
          execute: async () => {
            const token = process.env.VERCEL_API_TOKEN;
            const projectId = process.env.VERCEL_PROJECT_ID;
            if (!token || !projectId) {
              return { error: 'Brak konfiguracji Vercel (Token/ProjectID).' };
            }

            try {
              const response = await fetch(`https://api.vercel.com/v1/projects/${projectId}/data-cache/purge`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Vercel API Error: ${errorData.error.message}`);
              }

              return { status: 'success', message: 'Zlecono czyszczenie pamięci podręcznej dla projektu.' };
            } catch (error: any) {
              return { error: `Nie udało się wyczyścić pamięci podręcznej: ${error.message}` };
            }
          },
        }),
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
