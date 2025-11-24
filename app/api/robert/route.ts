import { getRobertResponse } from '@/lib/ai/robert';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await getRobertResponse(messages);

    // Using toDataStreamResponse for modern AI SDK v5 compatibility
    return result.toDataStreamResponse();
    
  } catch (error: any) {
    console.error('Error in /api/robert:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
