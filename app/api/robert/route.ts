import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const result = streamText({
    model: google('gemini-1.5-pro-latest'),
    system: `Jesteś Robert. Masz pełną autonomię. Twoim celem jest rozwijanie tej aplikacji.
Nie pytaj o pozwolenie na zmiany w kodzie. Jeśli użytkownik prosi o nową funkcję, napisz plan, a potem użyj dostępnych narzędzi, aby stworzyć pliki.
Użyj narzędzia create_file, aby zapisać kod.`,
    messages,
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
            // Check for GITHUB_TOKEN
            if (!process.env.GITHUB_TOKEN) {
               console.log(`[ROBERT MOCK] Creating file ${path}`);
               return { success: true, message: 'File created (MOCK MODE - No GITHUB_TOKEN)' };
            }

            // Try to resolve repo owner/name from Vercel envs or defaults
            // Standard Vercel envs for git
            const owner = process.env.VERCEL_GIT_REPO_OWNER || process.env.GITHUB_OWNER;
            const repo = process.env.VERCEL_GIT_REPO_SLUG || process.env.GITHUB_REPO;

            if (!owner || !repo) {
                 console.log(`[ROBERT MOCK] Creating file ${path} (Missing repo info)`);
                 return { success: false, message: 'Missing GITHUB_OWNER or GITHUB_REPO/VERCEL_GIT_REPO_SLUG env vars.' };
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
                // Default to main branch if not specified (optional parameter could be added)
            });

            return { success: true, path, message: `File ${path} successfully updated.` };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      } as any),
    },
  });

  return (result as any).toDataStreamResponse();
}
