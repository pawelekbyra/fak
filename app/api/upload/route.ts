import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'No filename or body provided' }, { status: 400 });
  }

  try {
      const blob = await put(filename, request.body, {
        access: 'public',
      });
      return NextResponse.json(blob);
  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
