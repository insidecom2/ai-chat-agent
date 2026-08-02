import { NextRequest, NextResponse } from 'next/server';
import { extractGeminiImage, parseGeminiError } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 501 }
    );
  }

  let body: { prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json({ error: parseGeminiError(errorText, response.status) }, {
        status: response.status,
      });
    }

    const payload = await response.json();
    const image = extractGeminiImage(payload);
    if (!image) {
      const blockReason = (payload as { promptFeedback?: { blockReason?: string } })
        ?.promptFeedback?.blockReason;
      return NextResponse.json(
        {
          error: blockReason
            ? `Request blocked by Gemini safety filters (${blockReason}).`
            : 'Gemini returned no image for this prompt.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach Gemini';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
