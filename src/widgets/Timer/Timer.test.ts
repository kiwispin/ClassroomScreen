import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import type { WidgetInstance } from '../../store/types';
import { playCustomAudio } from '../../lib/audio-storage';
import Timer from './index';
import { dueWarningMinutes, remainingMs, parseMmss, formatMmss } from './logic';

vi.mock('../../lib/audio-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/audio-storage')>();
  return { ...actual, playCustomAudio: vi.fn().mockResolvedValue(undefined) };
});

describe('dueWarningMinutes', () => {
  it('returns selected warnings as the timer crosses their thresholds', () => {
    expect(dueWarningMinutes(5 * 60_000, [5, 2, 1], new Set())).toEqual([5]);
    expect(dueWarningMinutes(59_000, [5, 2, 1], new Set())).toEqual([1, 2, 5]);
  });

  it('does not repeat fired warnings or warn at zero', () => {
    expect(dueWarningMinutes(60_000, [5, 2, 1], new Set([1, 5]))).toEqual([2]);
    expect(dueWarningMinutes(0, [5, 2, 1], new Set())).toEqual([]);
  });
});

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

describe('Timer warning playback', () => {
  it('plays the shared custom sound when a selected warning threshold is reached', () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    });

    const instance: WidgetInstance = {
      id: 'timer-custom-warning-test',
      type: 'timer',
      position: { x: 0, y: 0 },
      size: { width: 480, height: 200 },
      zIndex: 1,
      config: {
        fullDurationMs: 5 * 60_000,
        durationMs: 5 * 60_000,
        running: true,
        startedAt: Date.now() - 4 * 60_000,
        warningMinutes: [1],
        warningSfx: 'custom',
        customSoundId: 'audio-123',
      },
    };

    render(createElement(Timer, { instance }));

    expect(playCustomAudio).toHaveBeenCalledWith('audio-123');
  });
});
