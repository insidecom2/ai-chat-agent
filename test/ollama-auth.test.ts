import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOllamaAuthorization, OllamaAuthConfigurationError } from '@/lib/ollama-auth';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('createOllamaAuthorization', () => {
  it('creates a signed HS256 token for Ollama that expires in five minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T00:00:00Z'));
    vi.stubEnv('OLLAMA_API_KEY', 'test-secret');
    vi.stubEnv('OLLAMA_JWT_ISSUER', 'chat-agent');

    const authorization = createOllamaAuthorization('user-123');
    const token = authorization.slice('Bearer '.length);
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    expect(authorization.startsWith('Bearer ')).toBe(true);
    expect(JSON.parse(Buffer.from(encodedHeader, 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())).toEqual({
      iss: 'chat-agent',
      aud: 'ollama',
      sub: 'user-123',
      exp: 1_789_171_500,
    });
    expect(signature).toBe(createHmac('sha256', 'test-secret').update(`${encodedHeader}.${encodedPayload}`).digest('base64url'));
  });

  it('uses the configured subject when a request subject is unavailable', () => {
    vi.stubEnv('OLLAMA_API_KEY', 'test-secret');
    vi.stubEnv('OLLAMA_JWT_ISSUER', 'chat-agent');
    vi.stubEnv('OLLAMA_JWT_SUBJECT', 'fortune-service');

    const [, encodedPayload] = createOllamaAuthorization().slice('Bearer '.length).split('.');

    expect(JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()).sub).toBe('fortune-service');
  });

  it('rejects missing signing configuration', () => {
    expect(() => createOllamaAuthorization('user-123')).toThrow(OllamaAuthConfigurationError);
  });
});
