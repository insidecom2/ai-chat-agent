import { describe, it, expect } from 'vitest';
import { COMMANDS } from '@/lib/commands';

describe('COMMANDS', () => {
  it('is not empty', () => {
    expect(COMMANDS.length).toBeGreaterThan(0);
  });

  it('each command has a key starting with /', () => {
    for (const cmd of COMMANDS) {
      expect(cmd.key.startsWith('/')).toBe(true);
    }
  });

  it('each command has a non-empty description', () => {
    for (const cmd of COMMANDS) {
      expect(cmd.desc.length).toBeGreaterThan(0);
    }
  });

  it('includes /gen-image', () => {
    const keys = COMMANDS.map((c) => c.key);
    expect(keys).toContain('/gen-image');
  });

  it('includes /gemini-image', () => {
    const keys = COMMANDS.map((c) => c.key);
    expect(keys).toContain('/gemini-image');
  });
});
