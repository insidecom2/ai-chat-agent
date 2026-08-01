import { describe, it, expect } from 'vitest';
import { formatBytes, formatDate } from '@/lib/utils';

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });

  it('formats terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1.0 TB');
  });
});

describe('formatDate', () => {
  it('returns em dash for undefined', () => {
    expect(formatDate()).toBe('—');
  });

  it('returns em dash for nullish', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    expect(result).not.toBe('—');
    expect(result).toContain('2024');
  });

  it('formats a Date string with time', () => {
    const result = formatDate('2024-12-25T00:00:00.000Z');
    expect(result).toContain('2024');
  });
});
