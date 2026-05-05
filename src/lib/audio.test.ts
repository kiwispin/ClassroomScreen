import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SFX_NAMES, playSfx } from './audio';

describe('audio', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports the expected SFX names', () => {
    expect(SFX_NAMES).toEqual(['bell', 'chime', 'alarm', 'gentle']);
  });

  it('playSfx returns silently when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(() => playSfx('bell')).not.toThrow();
  });

  it('playSfx invokes AudioContext when available', () => {
    const fakeOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const fakeGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const fakeCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => fakeOsc),
      createGain: vi.fn(() => fakeGain),
      close: vi.fn(),
    };
    const ctorSpy = vi.fn();
    function Mock(this: unknown) {
      ctorSpy();
      return fakeCtx;
    }
    vi.stubGlobal('AudioContext', Mock);
    playSfx('bell');
    expect(ctorSpy).toHaveBeenCalled();
    expect(fakeCtx.createOscillator).toHaveBeenCalled();
    expect(fakeOsc.start).toHaveBeenCalled();
  });
});
