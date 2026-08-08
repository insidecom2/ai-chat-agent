import { NextRequest, NextResponse } from 'next/server';
import { EnvHttpProxyAgent, fetch as undiciFetch } from 'undici';
import { mimeTypeFromBase64, parseHFError } from '@/lib/huggingface';
import { requireUserId } from '@/lib/db/auth';
import { limitImagePrompt } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HF_ROUTER_ENDPOINT = 'https://router.huggingface.co';
const REQUEST_TIMEOUT_MS = 120_000;
const proxyAgent = new EnvHttpProxyAgent();

export async function POST(request: NextRequest) {
  if (!(await requireUserId())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.HF_TOKEN || '';
  const model = process.env.HF_MODEL || '';
  const provider = process.env.HF_PROVIDER || 'nscale';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HF_TOKEN is not configured on the server.' },
      { status: 501 }
    );
  }
  if (!model) {
    return NextResponse.json(
      { error: 'HF_MODEL is not configured on the server.' },
      { status: 501 }
    );
  }

  let body: { prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? limitImagePrompt(body.prompt) : '';
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
  }

  try {
    const response = await undiciFetch(
      `${HF_ROUTER_ENDPOINT}/${provider}/v1/images/generations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        dispatcher: proxyAgent,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json({ error: parseHFError(errorText, response.status) }, {
        status: response.status,
      });
    }

    const payload = await response.json().catch(() => null);
    const imageData = (payload as { data?: { b64_json?: string }[] } | null)?.data?.[0]?.b64_json;
    if (!imageData) {
      return NextResponse.json(
        {
          error: 'HF_MODEL did not return an image. Check that the model supports text-to-image.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ mimeType: mimeTypeFromBase64(imageData), data: imageData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach Hugging Face';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
