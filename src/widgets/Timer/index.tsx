import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { playSfx, type SfxName } from '../../lib/audio';
import { playCustomAudio } from '../../lib/audio-storage';
import { stopBackgroundMusic } from '../../lib/background-music';
export {
  DEFAULT_GLASS_OPACITY as DEFAULT_TIMER_GLASS_OPACITY,
  MAX_GLASS_OPACITY as MAX_TIMER_GLASS_OPACITY,
  MIN_GLASS_OPACITY as MIN_TIMER_GLASS_OPACITY,
} from '../../lib/widget-glass';
import { dueWarningMinutes, formatMmss, remainingMs, type TimerState } from './logic';

export type TimerSfx = SfxName | 'custom';
export type TimerWarningSfx = SfxName | 'custom' | 'none';

export type TimerConfig = {
  durationMs?: number;
  fullDurationMs?: number;
  running?: boolean;
  startedAt?: number | null;
  sfx?: TimerSfx;
  customSoundId?: string;
  customSoundName?: string;
  autoReset?: boolean;
  warningMinutes?: number[];
  warningSfx?: TimerWarningSfx;
  frostedGlass?: boolean;
  glassOpacity?: number;
};

const MAX_TOTAL_SECONDS = 99 * 60 + 59;

const parseDigits = (ms: number): [number, number, number, number] => {
  const totalSeconds = Math.min(MAX_TOTAL_SECONDS, Math.max(0, Math.floor(ms / 1000)));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return [Math.floor(m / 10), m % 10, Math.floor(s / 10), s % 10];
};

const fromDigits = (
  mTens: number, mOnes: number, sTens: number, sOnes: number,
): number => ((mTens * 10 + mOnes) * 60 + sTens * 10 + sOnes) * 1000;

// --- WIDE-MODE digit column (per-digit +/-) ---------------------------------

const W_DIGIT = 'text-[clamp(36px,min(16cqw,52cqh),320px)]';
const W_PM = 'w-[clamp(14px,min(3cqw,9cqh),32px)] h-[clamp(14px,min(3cqw,9cqh),32px)]';
const W_ADJUST_BUTTON =
  'inline-flex w-[clamp(36px,min(10cqw,20cqh),64px)] h-[clamp(36px,min(10cqw,20cqh),64px)] items-center justify-center p-0 leading-none';
// Play/Pause and Reset share the same outer diameter — only the inner icon
// is slightly smaller on Reset so the square doesn't visually outweigh the play triangle.
const W_BTN = 'w-[clamp(36px,min(11cqw,32cqh),96px)] h-[clamp(36px,min(11cqw,32cqh),96px)]';
const W_PLAY_ICON = 'w-[clamp(12px,min(3.6cqw,11cqh),34px)] h-[clamp(12px,min(3.6cqw,11cqh),34px)]';
const W_RESET_BTN = W_BTN;
const W_RESET_ICON = 'w-[clamp(11px,min(2.9cqw,8.5cqh),26px)] h-[clamp(11px,min(2.9cqw,8.5cqh),26px)]';

type DigitColumnProps = {
  value: number;
  label: string;
  onAdjust: (delta: 1 | -1) => void;
  disabled?: boolean;
};

const DigitColumn = ({ value, label, onAdjust, disabled }: DigitColumnProps) => (
  <div className="flex flex-col items-center justify-center select-none">
    <button
      type="button"
      onClick={() => onAdjust(1)}
      disabled={disabled}
      className={`${W_ADJUST_BUTTON} rounded-md text-current opacity-60 hover:opacity-100 hover:bg-slate-400/20 disabled:opacity-0 disabled:pointer-events-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`}
      aria-label={`Increase ${label}`} title={`Increase ${label}`}
    >
      <Plus className={`${W_PM} pointer-events-none`} strokeWidth={2.5} />
    </button>
    <div className={`font-bold tabular-nums ${W_DIGIT} leading-none`}>{value}</div>
    <button
      type="button"
      onClick={() => onAdjust(-1)}
      disabled={disabled}
      className={`${W_ADJUST_BUTTON} rounded-md text-current opacity-60 hover:opacity-100 hover:bg-slate-400/20 disabled:opacity-0 disabled:pointer-events-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`}
      aria-label={`Decrease ${label}`} title={`Decrease ${label}`}
    >
      <Minus className={`${W_PM} pointer-events-none`} strokeWidth={2.5} />
    </button>
  </div>
);

// --- TALL-MODE progress ring ------------------------------------------------

// `fraction` here means "how full the ring is" (1 = full at start, 0 = empty
// when timer hits zero) — matches ClassroomScreen's depleting-arc style.
const ProgressRing = ({ fraction }: { fraction: number }) => {
  const r = 45;
  const c = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(1, fraction));
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      style={{ color: 'var(--w-accent, #6366f1)' }}
      aria-hidden
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(241 245 249)" strokeWidth="6" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - safe)}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 200ms linear' }}
      />
    </svg>
  );
};

// ----------------------------------------------------------------------------

type AspectMode = 'tall' | 'medium' | 'wide';
// aspect = width / height
const TALL_THRESHOLD = 1.5;   // < this → big ring around digits
const WIDE_THRESHOLD = 2.4;   // ≥ this → no ring, ultra-wide
// in between → small ring on left + digits in middle + controls on right

export default function Timer({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;

  const fullMs = cfg.fullDurationMs ?? cfg.durationMs ?? 5 * 60_000;
  const durationMs = cfg.durationMs ?? fullMs;
  const running = cfg.running ?? false;
  const startedAt = cfg.startedAt ?? null;
  const sfx: TimerSfx = cfg.sfx ?? 'bell';
  const customSoundId = cfg.customSoundId;
  const autoReset = cfg.autoReset ?? false;
  const warningMinutes = cfg.warningMinutes ?? [];
  const warningSfx: TimerWarningSfx = cfg.warningSfx ?? 'chime';

  const state: TimerState = { running, durationMs, startedAt };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = remainingMs(state, now);
  const atZero = remaining <= 0;

  const firedRef = useRef(false);
  const warningFiredRef = useRef<Set<number>>(new Set());
  const warningFlashTimeoutRef = useRef<number | null>(null);
  const [warningFlash, setWarningFlash] = useState(false);

  useEffect(() => () => {
    if (warningFlashTimeoutRef.current != null) {
      window.clearTimeout(warningFlashTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const due = dueWarningMinutes(remaining, warningMinutes, warningFiredRef.current);
    if (due.length === 0) return;

    due.forEach((minutes) => warningFiredRef.current.add(minutes));
    setWarningFlash(true);
    if (warningFlashTimeoutRef.current != null) {
      window.clearTimeout(warningFlashTimeoutRef.current);
    }
    warningFlashTimeoutRef.current = window.setTimeout(() => {
      setWarningFlash(false);
      warningFlashTimeoutRef.current = null;
    }, 900);
    if (warningSfx === 'custom' && customSoundId) {
      playCustomAudio(customSoundId);
    } else if (warningSfx !== 'none' && warningSfx !== 'custom') {
      playSfx(warningSfx);
    }
  }, [running, remaining, warningMinutes, warningSfx, customSoundId]);

  useEffect(() => {
    if (running && atZero && !firedRef.current) {
      firedRef.current = true;
      warningFiredRef.current.clear();
      stopBackgroundMusic();
      if (sfx === 'custom' && customSoundId) {
        playCustomAudio(customSoundId);
      } else if (sfx !== 'custom') {
        playSfx(sfx);
      }
      if (autoReset) {
        updateConfig(instance.id, {
          running: false,
          startedAt: null,
          durationMs: fullMs,
        });
      } else {
        updateConfig(instance.id, {
          running: false,
          startedAt: null,
          durationMs: 0,
        });
      }
    }
    if (!running || !atZero) firedRef.current = false;
  }, [running, atZero, sfx, customSoundId, autoReset, instance.id, updateConfig, fullMs]);

  // Aspect-ratio detection drives the layout
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState<AspectMode>('wide');
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (height === 0) return;
      const ratio = width / height;
      setAspect((prev) => {
        const next: AspectMode =
          ratio < TALL_THRESHOLD ? 'tall'
          : ratio < WIDE_THRESHOLD ? 'medium'
          : 'wide';
        return prev === next ? prev : next;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displayMs = Math.ceil((running ? remaining : durationMs) / 1000) * 1000;
  const [mTens, mOnes, sTens, sOnes] = parseDigits(displayMs);

  // Two views of progress:
  //   `elapsedFraction` (0 → 1) drives the wide-mode bottom bar that FILLS as time passes.
  //   `remainingFraction` (1 → 0) drives the ring that DEPLETES as time passes.
  const elapsedFraction = fullMs > 0 ? Math.max(0, Math.min(1, (fullMs - remaining) / fullMs)) : 0;
  const remainingFraction = fullMs > 0 ? Math.max(0, Math.min(1, remaining / fullMs)) : 1;

  const adjustDigit = (idx: 0 | 1 | 2 | 3, delta: 1 | -1) => {
    if (running) return;
    warningFiredRef.current.clear();
    const digits = parseDigits(displayMs);
    const maxes = [9, 9, 5, 9];
    const max = maxes[idx];
    // Wrap around: − from 0 → max, + from max → 0.
    const raw = digits[idx] + delta;
    digits[idx] = raw < 0 ? max : raw > max ? 0 : raw;
    const newMs = fromDigits(digits[0], digits[1], digits[2], digits[3]);
    updateConfig(instance.id, {
      fullDurationMs: newMs,
      durationMs: newMs,
      running: false,
      startedAt: null,
    });
  };

  // Tall layout uses a single +/- that bumps minutes by 1.
  const adjustMinutes = (delta: 1 | -1) => {
    if (running) return;
    warningFiredRef.current.clear();
    const totalSec = Math.floor(displayMs / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const nextMin = Math.max(0, Math.min(99, minutes + delta));
    const newMs = (nextMin * 60 + seconds) * 1000;
    updateConfig(instance.id, {
      fullDurationMs: newMs,
      durationMs: newMs,
      running: false,
      startedAt: null,
    });
  };

  const start = () => {
    if (running) return;
    setNow(Date.now());
    if (remaining <= 0) {
      updateConfig(instance.id, { running: true, durationMs: fullMs, startedAt: Date.now() });
    } else {
      updateConfig(instance.id, {
        running: true,
        startedAt: Date.now() - (durationMs - remaining),
      });
    }
  };
  const pause = () => {
    if (!running) return;
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      durationMs: remainingMs(state, Date.now()),
    });
  };
  const reset = () => {
    warningFiredRef.current.clear();
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      durationMs: fullMs,
    });
  };

  const flash = !running && remaining === 0 && fullMs > 0;
  const timerVisual = flash
    ? 'text-rose-500 motion-safe:animate-pulse'
    : warningFlash
      ? 'text-amber-500 motion-safe:animate-pulse'
      : '';

  // === TALL layout (square-ish) ============================================

  if (aspect === 'tall') {
    // Sizes are based on cqmin so they scale with the smaller dimension.
    const tallDigit = 'text-[clamp(28px,16cqmin,200px)]';
    const tallPm = 'w-[clamp(16px,4cqmin,40px)] h-[clamp(16px,4cqmin,40px)]';
    // Play and Reset share diameter; Reset icon ~80% of Play icon size.
    const tallPrimaryBtn =
      'w-[clamp(36px,11cqmin,80px)] h-[clamp(36px,11cqmin,80px)]';
    const tallPrimaryIcon =
      'w-[clamp(12px,3.6cqmin,28px)] h-[clamp(12px,3.6cqmin,28px)]';
    const tallResetBtn = tallPrimaryBtn;
    const tallResetIcon =
      'w-[clamp(11px,2.9cqmin,22px)] h-[clamp(11px,2.9cqmin,22px)]';
    const tallAdjustButton =
      'inline-flex w-[clamp(36px,12cqmin,72px)] h-[clamp(36px,12cqmin,72px)] items-center justify-center p-0 leading-none';

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full"
        role="group" aria-label="Timer"
      style={{ containerType: 'size' as const }}
      >
        {/* Big progress ring centered (80% of the smaller dimension) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: '80cqmin', height: '80cqmin' }}>
            <ProgressRing fraction={remainingFraction} />
          </div>
        </div>

        {/* Digits + single +/- in the middle */}
        <div
          className={
            'absolute inset-0 flex flex-col items-center justify-center select-none ' +
            timerVisual
          }
        >
          <button
            type="button"
            onClick={() => adjustMinutes(1)}
            disabled={running}
                  className={`${tallAdjustButton} rounded-md text-current opacity-60 hover:opacity-100 hover:bg-slate-400/20 disabled:opacity-0 disabled:pointer-events-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`}
            aria-label="Add a minute"
          >
            <Plus className={`${tallPm} pointer-events-none`} strokeWidth={2.5} />
          </button>
          <div className={`font-bold tabular-nums ${tallDigit} leading-none`}>
            {formatMmss(displayMs)}
          </div>
          <button
            type="button"
            onClick={() => adjustMinutes(-1)}
            disabled={running}
                  className={`${tallAdjustButton} rounded-md text-current opacity-60 hover:opacity-100 hover:bg-slate-400/20 disabled:opacity-0 disabled:pointer-events-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`}
            aria-label="Remove a minute"
          >
            <Minus className={`${tallPm} pointer-events-none`} strokeWidth={2.5} />
          </button>
        </div>

        {/* Play / Pause (bottom-left) */}
        {!running ? (
          <button
            onClick={start}
            disabled={fullMs === 0}
            className={`absolute bottom-[4cqmin] left-[4cqmin] rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${tallPrimaryBtn}`}
            aria-label="Start"
            title="Start"
          >
            <Play className={`${tallPrimaryIcon} ml-0.5`} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={pause}
            className={`absolute bottom-[4cqmin] left-[4cqmin] rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${tallPrimaryBtn}`}
            aria-label="Pause"
            title="Pause"
          >
            <Pause className={tallPrimaryIcon} fill="currentColor" />
          </button>
        )}

        {/* Reset (bottom-right) */}
        <button
          onClick={reset}
          className={`absolute bottom-[4cqmin] right-[4cqmin] rounded-full border border-slate-300 hover:bg-slate-400/20 text-current flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${tallResetBtn}`}
          aria-label="Reset"
          title="Reset"
        >
          <RotateCcw className={tallResetIcon} />
        </button>
      </div>
    );
  }

  // === MEDIUM layout (ring on the left + per-digit +/- + controls right) ===

  if (aspect === 'medium') {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full flex items-center p-3 gap-3"
        role="group" aria-label="Timer"
      style={{ containerType: 'size' as const }}
      >
        <div className="aspect-square h-full max-h-full max-w-[35%] flex items-center justify-center shrink-0">
          <ProgressRing fraction={remainingFraction} />
        </div>

        <div
          className={
            'flex-1 min-w-0 flex items-center justify-center gap-1 overflow-hidden ' +
            timerVisual
          }
        >
          <DigitColumn label="tens of minutes" value={mTens} onAdjust={(d) => adjustDigit(0, d)} disabled={running} />
          <DigitColumn label="minutes" value={mOnes} onAdjust={(d) => adjustDigit(1, d)} disabled={running} />
          <span className={`font-bold ${W_DIGIT} leading-none mx-0.5 mb-[2cqh]`}>:</span>
          <DigitColumn label="tens of seconds" value={sTens} onAdjust={(d) => adjustDigit(2, d)} disabled={running} />
          <DigitColumn label="seconds" value={sOnes} onAdjust={(d) => adjustDigit(3, d)} disabled={running} />
        </div>

        <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
          {!running ? (
            <button
              onClick={start}
              disabled={fullMs === 0}
              className={`rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_BTN}`}
              aria-label="Start"
              title="Start"
            >
              <Play className={`${W_PLAY_ICON} ml-0.5`} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={pause}
              className={`rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_BTN}`}
              aria-label="Pause"
              title="Pause"
            >
              <Pause className={W_PLAY_ICON} fill="currentColor" />
            </button>
          )}
          <button
            onClick={reset}
            className={`rounded-full border border-slate-300 hover:bg-slate-400/20 text-current flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_RESET_BTN}`}
            aria-label="Reset"
            title="Reset"
          >
            <RotateCcw className={W_RESET_ICON} />
          </button>
        </div>
      </div>
    );
  }

  // === WIDE layout (large ring on the left + digits + controls) ============

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex items-center justify-between p-3 gap-3"
      role="group" aria-label="Timer"
      style={{ containerType: 'size' as const }}
    >
      <div className="aspect-square h-[86%] max-h-full max-w-[32%] flex items-center justify-center shrink-0">
        <ProgressRing fraction={remainingFraction} />
      </div>

      <div
        className={
          'flex-1 min-w-0 flex items-center justify-center gap-1 overflow-hidden ' +
          timerVisual
        }
      >
        <DigitColumn label="tens of minutes" value={mTens} onAdjust={(d) => adjustDigit(0, d)} disabled={running} />
        <DigitColumn label="minutes" value={mOnes} onAdjust={(d) => adjustDigit(1, d)} disabled={running} />
        <span className={`font-bold ${W_DIGIT} leading-none mx-0.5 mb-[2cqh]`}>:</span>
        <DigitColumn label="tens of seconds" value={sTens} onAdjust={(d) => adjustDigit(2, d)} disabled={running} />
        <DigitColumn label="seconds" value={sOnes} onAdjust={(d) => adjustDigit(3, d)} disabled={running} />
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
        {!running ? (
          <button
            onClick={start}
            disabled={fullMs === 0}
            className={`rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_BTN}`}
            aria-label="Start"
            title="Start"
          >
            <Play className={`${W_PLAY_ICON} ml-0.5`} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={pause}
            className={`rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_BTN}`}
            aria-label="Pause"
            title="Pause"
          >
            <Pause className={W_PLAY_ICON} fill="currentColor" />
          </button>
        )}
        <button
          onClick={reset}
          className={`rounded-full border border-slate-300 hover:bg-slate-400/20 text-current flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${W_RESET_BTN}`}
          aria-label="Reset"
          title="Reset"
        >
          <RotateCcw className={W_RESET_ICON} />
        </button>
      </div>

      {/* Thin progress bar at the bottom (wide layout only) */}
      <div
        className="absolute left-0 right-0 bottom-0 h-1 bg-slate-100/60 pointer-events-none"
        aria-hidden
      >
        <div
          className="h-full"
          style={{
            width: `${Math.round(elapsedFraction * 100)}%`,
            background: 'var(--w-accent, #6366f1)',
            transition: 'width 200ms linear',
          }}
        />
      </div>
    </div>
  );
}
