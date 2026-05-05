import { describe, it, expect } from 'vitest';
import { remainingMs, parseMmss, formatMmss } from './logic';

describe('parseMmss', () => {
  it('parses MM:SS', () => {
    expect(parseMmss('05:30')).toBe(330_000);
    expect(parseMmss('00:10')).toBe(10_000);
    expect(parseMmss('99:59')).toBe(99 * 60_000 + 59_000);
  });

  it('returns null for invalid input', () => {
    expect(parseMmss('abc')).toBeNull();
    expect(parseMmss('5:99')).toBeNull();
    expect(parseMmss('')).toBeNull();
  });
});

describe('formatMmss', () => {
  it('formats milliseconds as MM:SS', () => {
    expect(formatMmss(0)).toBe('00:00');
    expect(formatMmss(60_000)).toBe('01:00');
    expect(formatMmss(330_500)).toBe('05:30');
    expect(formatMmss(-5_000)).toBe('00:00');
  });
});

describe('remainingMs', () => {
  it('returns full duration when not running', () => {
    expect(remainingMs({ running: false, durationMs: 60_000, startedAt: null }, 1_000)).toBe(60_000);
  });
  it('subtracts elapsed when running', () => {
    expect(remainingMs({ running: true, durationMs: 60_000, startedAt: 0 }, 25_000)).toBe(35_000);
  });
  it('floors at zero', () => {
    expect(remainingMs({ running: true, durationMs: 5_000, startedAt: 0 }, 999_999)).toBe(0);
  });
});
