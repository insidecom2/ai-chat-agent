import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/db/auth';
import { proxyOllamaRequest } from '@/lib/ollama-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return proxyOllamaRequest(request, userId);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return proxyOllamaRequest(request, userId);
}
