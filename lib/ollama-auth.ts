import { createHmac } from 'node:crypto';

const OLLAMA_AUDIENCE = 'ollama';
const TOKEN_TTL_SECONDS = 5 * 60;

export class OllamaAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaAuthConfigurationError';
  }
}

/** Creates the short-lived JWT required by the Ollama gateway. */
export function createOllamaAuthorization(subject?: string): string {
  const secret = process.env.OLLAMA_API_KEY;
  const issuer = process.env.OLLAMA_JWT_ISSUER;
  const configuredSubject = process.env.OLLAMA_JWT_SUBJECT;
  const tokenSubject = subject || configuredSubject;

  if (!secret || !issuer || !tokenSubject) {
    throw new OllamaAuthConfigurationError(
      'OLLAMA_API_KEY, OLLAMA_JWT_ISSUER, and OLLAMA_JWT_SUBJECT (when no user subject is available) must be configured.'
    );
  }

  const encodedHeader = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = encodeSegment({
    iss: issuer,
    aud: OLLAMA_AUDIENCE,
    sub: tokenSubject,
    exp: Math.floor(Date.now() / 1_000) + TOKEN_TTL_SECONDS,
  });
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `Bearer ${signingInput}.${signature}`;
}

function encodeSegment(value: Record<string, string | number>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
