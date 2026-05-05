import { describe, it, expect } from 'vitest';
import { elapsedMs, formatStopwatch } from './logic';

describe('elapsedMs', () => {
  it('returns accumulated when paused', () => {
    expect(elapsedMs({ running: false, startedAt: null, accumulatedMs: 5000 }, 999)).toBe(5000);
  });
  it('adds (now - startedAt) when running', () => {
    expect(elapsedMs({ running: true, startedAt: 100, accumulatedMs: 5000 }, 600)).toBe(5500);
  });
});

describe('formatStopwatch', () => {
  it('MM:SS under an hour', () => {
    expect(formatStopwatch(0)).toBe('00:00');
    expect(formatStopwatch(125_000)).toBe('02:05');
  });
  it('HH:MM:SS at and over one hour', () => {
    expect(formatStopwatch(3600_000)).toBe('01:00:00');
    expect(formatStopwatch(3725_000)).toBe('01:02:05');
  });
});
