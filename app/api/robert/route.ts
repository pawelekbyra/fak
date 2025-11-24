import { createVertex } from '@ai-sdk/google-vertex';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer'; // Wymagany import Node.js

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const vertexJsonBase64 = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64;

    // KRYTYCZNA DIAGNOSTYKA: Logowanie statusu poświadczeń
    console.log(`[ROBERT DIAGNOSTIC] Service Account Base64 present: ${!!vertexJsonBase64}, GitHub Token present: ${!!process.env.GITHUB_TOKEN}`);
    if (!vertexJsonBase64) {
      // Ten błąd ujawni, że zmienna nie została ustawiona
      return Response.json({ success: false, message: 'Server Configuration Error: Missing VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64 environment variable. Please configure the Service Account key (Base64 encoded) on Vercel.' }, { status: 500 });
    }

    // 1. Dekodowanie JSON Service Account z Base64
    const vertexCredentials = JSON.parse(Buffer.from(vertexJsonBase64, 'base64').toString('utf-8'));
    // 2. Użycie Vertex AI Provider
    const vertex = createVertex({
      // Używamy danych z zdekodowanego JSON Service Account
      project: vertexCredentials.project_id,
      location: 'us-central1', // Standardowa lokalizacja dla Gemini
      googleAuthOptions: {
        credentials: {
          client_email: vertexCredentials.client_email,
          private_key: vertexCredentials.private_key,
        },
      },
    });
    const { messages } = await req.json();

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    const result = streamText({
      // Używamy poprawnego modelu Vertex AI
      model: vertex('gemini-2.0-flash-exp'),
      system: `Jesteś Robert (Genesis Architect). Masz pełną autonomię. Twoim celem jest rozwijanie tej aplikacji.
  Nie pytaj o pozwolenie na zmiany w kodzie. Jeśli użytkownik prosi o nową funkcję, napisz plan, a potem użyj narzędzi, aby stworzyć pliki.
  Zawsze używaj narzędzia create_file, aby zapisać kod.`,
      messages,
      // @ts-ignore
      maxSteps: 5,
      tools: {
        create_file: tool({
          description: 'Create or update a file in the repository. Path should be relative to root (e.g., "app/new-page.tsx").',
          parameters: z.object({
            path: z.string().describe('The file path to create or update'),
            content: z.string().describe('The content of the file'),
            message: z.string().describe('Commit message'),
          }),
          execute: async ({ path, content, message }: { path: string; content: string; message: string }) => {
            try {
              if (!process.env.GITHUB_TOKEN) {
                console.log(`[ROBERT MOCK] Creating file ${path}`);
                return { success: true, message: 'File created (MOCK MODE - No GITHUB_TOKEN)' };
              }
              const owner = process.env.VERCEL_GIT_REPO_OWNER || process.env.GITHUB_OWNER;
              const repo = process.env.VERCEL_GIT_REPO_SLUG || process.env.GITHUB_REPO;
              if (!owner || !repo) {
                return { success: false, message: 'Missing GITHUB_OWNER or GITHUB_REPO env vars.' };
              }
              // Check if file exists to get sha for update
              let sha: string | undefined;
              try {
                const { data } = await octokit.repos.getContent({ owner, repo, path });
                if (!Array.isArray(data) && 'sha' in data) {
                  sha = data.sha;
                }
              } catch (e) {
                // File doesn't exist, ignore
              }
              await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message,
                content: Buffer.from(content).toString('base64'),
                sha,
              });
              return { success: true, path, message: `File ${path} successfully updated.` };
            } catch (error: any) {
              console.error(`[ROBERT TOOL ERROR] ${error.message}`);
              return { success: false, error: error.message };
            }
          },
        } as any),
      },
    });
    return (result as any).toDataStreamResponse();
  } catch (error: any) {
    console.error("[ROBERT FATAL ERROR]", error);
    return Response.json({ error: error.message || "Unknown Server Error during AI initialization." }, { status: 500 });
  }
}
