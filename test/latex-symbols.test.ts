import { describe, it, expect } from 'vitest';
import { replaceLatexSymbols } from '@/lib/latex-symbols';

describe('replaceLatexSymbols', () => {
  it('replaces \\uparrow inside $...$', () => {
    expect(replaceLatexSymbols('$\\uparrow$')).toBe('↑');
  });

  it('replaces \\rightarrow inside $...$', () => {
    expect(replaceLatexSymbols('$\\rightarrow$')).toBe('→');
  });

  it('replaces multiple commands inside a single group', () => {
    expect(replaceLatexSymbols('$\\uparrow$ and $\\rightarrow$')).toBe('↑ and →');
  });

  it('replaces commands within inline math text', () => {
    expect(replaceLatexSymbols('$x \\rightarrow y$')).toBe('x → y');
  });

  it('leaves unknown math groups untouched', () => {
    expect(replaceLatexSymbols('$\\frac{a}{b}$')).toBe('$\\frac{a}{b}$');
  });

  it('replaces bare commands without dollar signs', () => {
    expect(replaceLatexSymbols('Use \\uparrow to increase')).toBe('Use ↑ to increase');
  });

  it('replaces commands inside code fences', () => {
    expect(replaceLatexSymbols('```text\n$\\uparrow$ $\\rightarrow$\n```')).toBe(
      '```text\n↑ →\n```'
    );
  });

  it('does not touch plain text without commands', () => {
    expect(replaceLatexSymbols('hello world')).toBe('hello world');
  });
});
