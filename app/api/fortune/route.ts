import { NextRequest, NextResponse } from 'next/server';
import { CELESTIAL_MODEL, buildCelestialSystemMessage } from '@/lib/celestial-user-info';
import { buildFortuneUserMessage, normalizeFortuneRequest } from '@/lib/fortune';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_REQUEST_BODY = 64_000;

export async function POST(request: NextRequest) {
  const targetHost = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
  const apiKey = process.env.OLLAMA_API_KEY || '';

  let raw: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > MAX_REQUEST_BODY) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = normalizeFortuneRequest(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const messages = [
    {
      role: 'system',
      content: buildCelestialSystemMessage({
        fullName: parsed.value.fullName,
        birthDate: parsed.value.birthDate,
      }),
    },
    {
      role: 'user',
      content: buildFortuneUserMessage(parsed.value.topics, parsed.value.extraText),
    },
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/x-ndjson, text/event-stream',
    'Accept-Encoding': 'identity',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${targetHost}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: CELESTIAL_MODEL, messages, stream: true }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('content-type') || 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach the fortune model';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}