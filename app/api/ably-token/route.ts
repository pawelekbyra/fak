import { NextRequest, NextResponse } from 'next/server';
import { ably } from '@/lib/ably-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = await ably.auth.createTokenRequest({ clientId: 'ting-tong-client' });
  return NextResponse.json(token);
}
