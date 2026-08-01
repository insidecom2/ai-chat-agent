import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest) {
  const targetHost = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
  const apiKey = process.env.OLLAMA_API_KEY || '';

  const path = request.nextUrl.pathname.replace('/api/ollama', '/api');
  const targetUrl = `${targetHost}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/x-ndjson, text/event-stream',
    'Accept-Encoding': 'identity',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === 'POST' ? await request.text() : undefined,
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
