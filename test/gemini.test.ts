import { describe, it, expect } from 'vitest';
import { extractGeminiImage, parseGeminiError } from '@/lib/gemini';

describe('extractGeminiImage', () => {
  it('returns null for empty payload', () => {
    expect(extractGeminiImage({})).toBeNull();
  });

  it('returns null when candidates are missing', () => {
    expect(extractGeminiImage({ promptFeedback: {} })).toBeNull();
  });

  it('returns null when no part has inlineData', () => {
    const payload = { candidates: [{ content: { parts: [{ text: 'caption' }] } }] };
    expect(extractGeminiImage(payload)).toBeNull();
  });

  it('extracts inlineData when it is the only part', () => {
    const payload = {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } }],
    };
    expect(extractGeminiImage(payload)).toEqual({ mimeType: 'image/png', data: 'abc' });
  });

  it('skips text parts and picks the inlineData part', () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Here is your image.' },
              { inlineData: { mimeType: 'image/jpeg', data: 'xyz' } },
            ],
          },
        },
      ],
    };
    expect(extractGeminiImage(payload)).toEqual({ mimeType: 'image/jpeg', data: 'xyz' });
  });

  it('ignores parts missing mimeType or data', () => {
    const payload = {
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { mimeType: 'image/png' } },
              { inlineData: { data: 'zzz' } },
              { inlineData: { mimeType: 'image/webp', data: 'img' } },
            ],
          },
        },
      ],
    };
    expect(extractGeminiImage(payload)).toEqual({ mimeType: 'image/webp', data: 'img' });
  });
});

describe('parseGeminiError', () => {
  it('returns friendly message for 403', () => {
    expect(parseGeminiError('', 403)).toBe(
      'Invalid Gemini API key or insufficient permissions.'
    );
  });

  it('extracts message from JSON error body', () => {
    expect(parseGeminiError('{"error":{"message":"API key not valid"}}', 400)).toBe(
      'API key not valid'
    );
  });

  it('falls back to status message for non-JSON body', () => {
    expect(parseGeminiError('<html>oops</html>', 429)).toBe('Gemini API returned HTTP 429.');
  });

  it('falls back to status message for malformed JSON', () => {
    expect(parseGeminiError('{broken', 500)).toBe('Gemini API returned HTTP 500.');
  });
});
