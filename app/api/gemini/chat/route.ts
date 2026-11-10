import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/db/auth';
import { parseGeminiError } from '@/lib/gemini';
import { GEMINI_CHAT_MODEL } from '@/store/modelStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_REQUEST_BODY = 30_000_000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  imageMimeTypes?: string[];
}

export async function POST(request: NextRequest) {
  if (!(await requireUserId())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 501 },
    );
  }

  let body: {
    systemInstruction?: unknown;
    messages?: unknown;
  };
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody) > MAX_REQUEST_BODY) {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'At least one chat message is required.' }, { status: 400 });
  }

  const contents = body.messages.map((entry): { role: string; parts: unknown[] } | null => {
    if (!entry || typeof entry !== 'object') return null;
    const message = entry as Partial<ChatMessage>;
    if ((message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string') {
      return null;
    }

    const parts: unknown[] = [{ text: message.content }];
    if (Array.isArray(message.images)) {
      message.images.forEach((data, index) => {
        if (typeof data !== 'string') return;
        const mimeType = message.imageMimeTypes?.[index];
        parts.push({
          inlineData: {
            mimeType: typeof mimeType === 'string' && mimeType.startsWith('image/')
              ? mimeType
              : 'image/jpeg',
            data,
          },
        });
      });
    }
    return { role: message.role === 'assistant' ? 'model' : 'user', parts };
  });

  if (contents.some((message) => message === null)) {
    return NextResponse.json({ error: 'Invalid chat message.' }, { status: 400 });
  }

  const payload = {
    contents,
    ...(typeof body.systemInstruction === 'string' && body.systemInstruction
      ? { systemInstruction: { parts: [{ text: body.systemInstruction }] } }
      : {}),
  };

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/${GEMINI_CHAT_MODEL}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: request.signal,
      },
    );

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: parseGeminiError(errorText, response.status) },
        { status: response.status || 502 },
      );
    }

    return new Response(toOllamaCompatibleStream(response.body), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach Gemini';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function toOllamaCompatibleStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const boundary = buffer.indexOf('\n\n');
          if (boundary >= 0) {
            const event = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            writeEvent(event, controller, encoder);
            return;
          }

          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) writeEvent(buffer, controller, encoder);
            controller.enqueue(encoder.encode('{"done":true}\n'));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        }
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
}

function writeEvent(
  event: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  const data = event
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');
  if (!data || data === '[DONE]') return;

  try {
    const payload = JSON.parse(data) as {
      candidates?: { content?: { parts?: { text?: unknown }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('');
    if (text) {
      controller.enqueue(encoder.encode(`${JSON.stringify({ message: { content: text } })}\n`));
    }
  } catch {
    // Ignore malformed or non-text server events and continue reading the stream.
  }
}
