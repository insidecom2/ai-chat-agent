import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/db/auth';
import { createOllamaAuthorization, OllamaAuthConfigurationError } from '@/lib/ollama-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_REQUEST_BODY = 30_000_000

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return proxyRequest(request, userId);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return proxyRequest(request, userId);
}

async function proxyRequest(request: NextRequest, userId: string) {
  const targetHost = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');

  const path = request.nextUrl.pathname.replace('/api/ollama', '/api');
  const targetUrl = `${targetHost}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/x-ndjson, text/event-stream',
    'Accept-Encoding': 'identity',
  };
  try {
    headers['Authorization'] = createOllamaAuthorization(userId);
  } catch (error) {
    if (error instanceof OllamaAuthConfigurationError) {
      return NextResponse.json({ error: 'Ollama authentication is not configured.' }, { status: 500 });
    }
    throw error;
  }

  try {
    const body = request.method === 'POST' ? await request.text() : undefined
    if (body && Buffer.byteLength(body) > MAX_REQUEST_BODY) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 })
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
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
    const message = error instanceof Error ? error.message : 'Unable to reach Ollama';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
