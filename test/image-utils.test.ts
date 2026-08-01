import { describe, it, expect } from 'vitest';
import { formatImagePrompt, getPollinationsUrl } from '@/lib/image-utils';

describe('formatImagePrompt', () => {
  it('returns the prompt unchanged when no special syntax', () => {
    expect(formatImagePrompt('hello world', [])).toBe('hello world');
  });

  it('strips /imagine prefix', () => {
    expect(formatImagePrompt('/imagine a sunset over mountains', [])).toBe('a sunset over mountains');
  });

  it('extracts quoted text', () => {
    expect(formatImagePrompt('prompt with "quoted content" inside', [])).toBe('quoted content');
  });

  it('extracts first quoted pair when multiple exist', () => {
    expect(formatImagePrompt('first "alpha" second "beta"', [])).toBe('alpha');
  });

  it('returns default for empty prompt', () => {
    expect(formatImagePrompt('', [])).toBe('A beautiful landscape');
  });

  it('/imagine takes precedence over quotes', () => {
    expect(formatImagePrompt('/imagine dragon "not this"', [])).toBe('dragon "not this"');
  });

  it('handles prompt with only whitespace after /imagine', () => {
    expect(formatImagePrompt('/imagine    ', [])).toBe('A beautiful landscape');
  });

  it('handles prompt with only quotes (default fallback)', () => {
    expect(formatImagePrompt('""', [])).toBe('A beautiful landscape');
  });

  it('handles unclosed quote', () => {
    expect(formatImagePrompt('text with "unclosed', [])).toBe('text with "unclosed');
  });
});

describe('getPollinationsUrl', () => {
  it('encodes simple prompt', () => {
    expect(getPollinationsUrl('hello')).toBe('https://image.pollinations.ai/prompt/hello');
  });

  it('encodes spaces', () => {
    expect(getPollinationsUrl('hello world')).toBe(
      'https://image.pollinations.ai/prompt/hello%20world'
    );
  });

  it('encodes special characters', () => {
    expect(getPollinationsUrl('cat & dog')).toBe(
      'https://image.pollinations.ai/prompt/cat%20%26%20dog'
    );
  });

  it('encodes unicode', () => {
    expect(getPollinationsUrl('宇宙')).toBe(
      'https://image.pollinations.ai/prompt/%E5%AE%87%E5%AE%99'
    );
  });
});
