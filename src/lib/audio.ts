export const SFX_NAMES = ['bell', 'chime', 'alarm', 'gentle'] as const;
export type SfxName = (typeof SFX_NAMES)[number];

type Tone = {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
};

const SCRIPTS: Record<SfxName, Tone[]> = {
  bell: [
    { freq: 880, start: 0, duration: 0.6, type: 'sine', volume: 0.4 },
    { freq: 660, start: 0.18, duration: 0.6, type: 'sine', volume: 0.3 },
  ],
  chime: [
    { freq: 523.25, start: 0, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 659.25, start: 0.18, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 783.99, start: 0.36, duration: 0.5, type: 'triangle', volume: 0.35 },
  ],
  alarm: [
    { freq: 880, start: 0, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.28, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.56, duration: 0.18, type: 'square', volume: 0.25 },
  ],
  gentle: [
    { freq: 440, start: 0, duration: 0.8, type: 'sine', volume: 0.3 },
    { freq: 554.37, start: 0.4, duration: 0.8, type: 'sine', volume: 0.25 },
  ],
};

type CtxCtor = new () => AudioContext;

const getCtxCtor = (): CtxCtor | undefined => {
  const w = globalThis as unknown as {
    AudioContext?: CtxCtor;
    webkitAudioContext?: CtxCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
};

export const playSfx = (name: SfxName): void => {
  const Ctor = getCtxCtor();
  if (!Ctor) return;

  const ctx = new Ctor();
  const now = ctx.currentTime;
  const tones = SCRIPTS[name];
  let endTime = now;

  tones.forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, now + t.start);
    const v = t.volume ?? 0.3;
    gain.gain.setValueAtTime(0.0001, now + t.start);
    gain.gain.linearRampToValueAtTime(v, now + t.start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t.start);
    osc.stop(now + t.start + t.duration);
    endTime = Math.max(endTime, now + t.start + t.duration);
  });

  setTimeout(() => ctx.close(), Math.max(0, (endTime - now) * 1000) + 100);
};
