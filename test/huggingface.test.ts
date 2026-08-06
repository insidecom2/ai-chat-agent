import { describe, it, expect } from 'vitest';
import { mimeTypeFromBase64, parseHFError } from '@/lib/huggingface';

describe('mimeTypeFromBase64', () => {
  it('detects JPEG', () => {
    expect(mimeTypeFromBase64('/9j/4AAQSkZJRg')).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    expect(mimeTypeFromBase64('iVBORw0KGgoAAAAN')).toBe('image/png');
  });

  it('detects GIF', () => {
    expect(mimeTypeFromBase64('R0lGODlhAQABAAAAACw=')).toBe('image/gif');
  });

  it('detects WebP', () => {
    expect(mimeTypeFromBase64('UklGRh4AAABXRUJQVlA4TA')).toBe('image/webp');
  });

  it('falls back to JPEG for unknown data', () => {
    expect(mimeTypeFromBase64('unknown')).toBe('image/jpeg');
  });
});

describe('parseHFError', () => {
  it('returns friendly message for 401', () => {
    expect(parseHFError('', 401)).toBe('Invalid Hugging Face token (HF_TOKEN).');
  });

  it('returns friendly message for 403', () => {
    expect(parseHFError('', 403)).toBe(
      'This Hugging Face model requires access your token does not have.'
    );
  });

  it('returns friendly message for 404', () => {
    expect(parseHFError('', 404)).toBe(
      'Hugging Face model not found. Check HF_MODEL.'
    );
  });

  it('extracts message from JSON error body', () => {
    expect(parseHFError('{"error":"Model x is loading..."}', 503)).toBe(
      'Model x is loading...'
    );
  });

  it('falls back to status message for non-JSON body', () => {
    expect(parseHFError('<html>oops</html>', 500)).toBe(
      'Hugging Face API returned HTTP 500.'
    );
  });

  it('falls back to status message for malformed JSON', () => {
    expect(parseHFError('{broken', 429)).toBe('Hugging Face API returned HTTP 429.');
  });
});
