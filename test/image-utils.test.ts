import { describe, it, expect } from 'vitest';
import { formatImagePrompt, getLatestImagePrompt, getPollinationsUrl, extractImagePrompt, limitImagePrompt, MAX_IMAGE_PROMPT_LENGTH } from '@/lib/image-utils';

describe('limitImagePrompt', () => {
  it('trims prompts to a safe size for image APIs', () => {
    const prompt = 'x'.repeat(MAX_IMAGE_PROMPT_LENGTH + 100);
    expect(limitImagePrompt(prompt)).toHaveLength(MAX_IMAGE_PROMPT_LENGTH);
  });

  it('trims surrounding whitespace from short prompts', () => {
    expect(limitImagePrompt('  sunset  ')).toBe('sunset');
  });
});

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
  it('encodes simple prompt with quality defaults', () => {
    expect(getPollinationsUrl('hello')).toBe(
      'https://image.pollinations.ai/prompt/hello?model=flux&enhance=true&width=512&height=512'
    );
  });

  it('encodes spaces', () => {
    expect(getPollinationsUrl('hello world')).toBe(
      'https://image.pollinations.ai/prompt/hello%20world?model=flux&enhance=true&width=512&height=512'
    );
  });

  it('encodes special characters', () => {
    expect(getPollinationsUrl('cat & dog')).toBe(
      'https://image.pollinations.ai/prompt/cat%20%26%20dog?model=flux&enhance=true&width=512&height=512'
    );
  });

  it('encodes unicode', () => {
    expect(getPollinationsUrl('宇宙')).toBe(
      'https://image.pollinations.ai/prompt/%E5%AE%87%E5%AE%99?model=flux&enhance=true&width=512&height=512'
    );
  });

  it('disables enhance when set to false', () => {
    expect(getPollinationsUrl('hello', { enhance: false })).toBe(
      'https://image.pollinations.ai/prompt/hello?model=flux&width=512&height=512'
    );
  });

  it('supports custom model', () => {
    expect(getPollinationsUrl('hello', { model: 'turbo' })).toBe(
      'https://image.pollinations.ai/prompt/hello?model=turbo&enhance=true&width=512&height=512'
    );
  });

  it('supports negative prompt', () => {
    expect(getPollinationsUrl('hello', { negativePrompt: 'blurry' })).toBe(
      'https://image.pollinations.ai/prompt/hello?model=flux&enhance=true&negative_prompt=blurry&width=512&height=512'
    );
  });

  it('supports custom width and height', () => {
    expect(getPollinationsUrl('hello', { width: 1024, height: 768 })).toBe(
      'https://image.pollinations.ai/prompt/hello?model=flux&enhance=true&width=1024&height=768'
    );
  });
});

describe('extractImagePrompt', () => {
  it('extracts prompt from dalle.text2im style response', () => {
    const resp = JSON.stringify({
      action: 'dalle.text2im',
      action_input: JSON.stringify({ prompt: 'a plate of Pad Kra Pao' }),
      thought: 'The user wants an image.',
    });
    expect(extractImagePrompt(resp)).toBe('a plate of Pad Kra Pao');
  });

  it('extracts prompt from an object with a prompt field', () => {
    const resp = JSON.stringify({ action: 'text2im', prompt: 'sunset over the ocean' });
    expect(extractImagePrompt(resp)).toBe('sunset over the ocean');
  });

  it('extracts prompt from JSON wrapped in markdown fences', () => {
    const resp = '```json\n{"action":"dalle.text2im","action_input":"{\\"prompt\\":\\"a red dragon\\"}"}\n```';
    expect(extractImagePrompt(resp)).toBe('a red dragon');
  });

  it('extracts prompt from JSON embedded in prose', () => {
    const resp = 'Here is the tool call: {"action_input": {"prompt": "a quiet lake at dawn"}} done';
    expect(extractImagePrompt(resp)).toBe('a quiet lake at dawn');
  });

  it('returns null when the content is not JSON', () => {
    expect(extractImagePrompt('plain response text')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(extractImagePrompt('')).toBeNull();
  });
});

describe('getLatestImagePrompt', () => {
  it('uses the latest user prompt and ignores image commands', () => {
    expect(getLatestImagePrompt([
      { role: 'user', content: 'a red dragon' },
      { role: 'assistant', content: 'Sure, I can help.' },
      { role: 'user', content: '/gemini-image' },
    ])).toBe('a red dragon');
  });

  it('extracts a structured prompt from the latest message', () => {
    expect(getLatestImagePrompt([
      { role: 'user', content: 'make an image' },
      { role: 'assistant', content: '{"prompt":"a blue dragon"}' },
    ])).toBe('a blue dragon');
  });

  it('returns null when no prompt exists', () => {
    expect(getLatestImagePrompt([
      { role: 'assistant', content: 'Welcome!' },
      { role: 'user', content: '/gen-image' },
    ])).toBeNull();
  });
});
