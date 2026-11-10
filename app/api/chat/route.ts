import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_CHAT_MODEL } from '@/store/modelStore';
import { proxyOllamaRequest } from '@/lib/ollama-proxy';
import { POST as geminiChat } from '@/app/api/gemini/chat/route';
import { requireUserId } from '@/lib/db/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_REQUEST_BODY = 30_000_000;

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: string;
  let body: {
    model?: unknown;
    messages?: unknown;
    systemInstruction?: unknown;
  };
  try {
    rawBody = await request.text();
    if (Buffer.byteLength(rawBody) > MAX_REQUEST_BODY) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body.model !== 'string' || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'A model and messages are required.' }, { status: 400 });
  }

  if (body.model === GEMINI_CHAT_MODEL) {
    const geminiRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: rawBody,
      signal: request.signal,
    });
    return geminiChat(geminiRequest);
  }

  const messages = body.messages.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const { imageMimeTypes: _imageMimeTypes, ...message } = entry as Record<string, unknown>;
    return message;
  });
  const ollamaMessages = [
    ...(typeof body.systemInstruction === 'string' && body.systemInstruction
      ? [{ role: 'system', content: body.systemInstruction }]
      : []),
    ...messages,
  ];
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.set('content-type', 'application/json');

  const ollamaRequest = new NextRequest(new URL('/api/ollama/chat', request.url), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      messages: ollamaMessages,
      stream: true,
    }),
    signal: request.signal,
  });

  return proxyOllamaRequest(ollamaRequest, userId, '/api/chat');
}
