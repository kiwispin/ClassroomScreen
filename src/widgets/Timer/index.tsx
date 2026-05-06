import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Plus, Minus } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { playSfx, type SfxName } from '../../lib/audio';
import { playCustomAudio } from '../../lib/audio-storage';
import { remainingMs, type TimerState } from './logic';
// Progress is shown as a thin bar at the bottom rather than a ring on the
// left, matching ClassroomScreen's layout where digits get most of the room.

export type TimerSfx = SfxName | 'custom';

export type TimerConfig = {
  durationMs?: number;
  fullDurationMs?: number;
  running?: boolean;
  startedAt?: number | null;
  sfx?: TimerSfx;
  customSoundId?: string;
  customSoundName?: string;
  autoReset?: boolean;
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

type DigitColumnProps = {
  value: number;
  onAdjust: (delta: 1 | -1) => void;
  disabled?: boolean;
};

// Sizes scale with min(cqw, cqh) so the timer fits both wide-and-short
// and tall-and-narrow tile shapes without overflow.
const DIGIT_SIZE = 'text-[clamp(36px,min(16cqw,52cqh),320px)]';
const PLUSMINUS_SIZE = 'w-[clamp(14px,min(3cqw,9cqh),32px)] h-[clamp(14px,min(3cqw,9cqh),32px)]';
const ROUND_BUTTON_SIZE = 'w-[clamp(36px,min(11cqw,32cqh),96px)] h-[clamp(36px,min(11cqw,32cqh),96px)]';
const PLAY_ICON_SIZE = 'w-[clamp(16px,min(5cqw,15cqh),44px)] h-[clamp(16px,min(5cqw,15cqh),44px)]';
const RESET_BUTTON_SIZE = 'w-[clamp(28px,min(8cqw,24cqh),68px)] h-[clamp(28px,min(8cqw,24cqh),68px)]';
const RESET_ICON_SIZE = 'w-[clamp(12px,min(3cqw,9cqh),26px)] h-[clamp(12px,min(3cqw,9cqh),26px)]';

const DigitColumn = ({ value, onAdjust, disabled }: DigitColumnProps) => (
  <div className="flex flex-col items-center justify-center select-none">
    <button
      onClick={() => onAdjust(1)}
      disabled={disabled}
      tabIndex={-1}
      className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 disabled:opacity-0 disabled:pointer-events-none transition-colors"
      aria-label="Increase"
    >
      <Plus className={PLUSMINUS_SIZE} strokeWidth={2.5} />
    </button>
    <div className={`font-bold tabular-nums ${DIGIT_SIZE} leading-none`}>
      {value}
    </div>
    <button
      onClick={() => onAdjust(-1)}
      disabled={disabled}
      tabIndex={-1}
      className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 disabled:opacity-0 disabled:pointer-events-none transition-colors"
      aria-label="Decrease"
    >
      <Minus className={PLUSMINUS_SIZE} strokeWidth={2.5} />
    </button>
  </div>
);

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
  useEffect(() => {
    if (running && atZero && !firedRef.current) {
      firedRef.current = true;
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

  // Digits driven by remaining time when running, otherwise by full duration
  const displayMs = running ? remaining : durationMs;
  const [mTens, mOnes, sTens, sOnes] = parseDigits(displayMs);

  // Elapsed / full ratio drives the bottom progress bar.
  const fraction = fullMs > 0 ? Math.max(0, Math.min(1, (fullMs - remaining) / fullMs)) : 0;

  const adjustDigit = (idx: 0 | 1 | 2 | 3, delta: 1 | -1) => {
    if (running) return;
    const digits = parseDigits(fullMs);
    const maxes = [9, 9, 5, 9];
    const next = digits[idx] + delta;
    if (next < 0 || next > maxes[idx]) return;
    digits[idx] = next;
    const newMs = fromDigits(digits[0], digits[1], digits[2], digits[3]);
    updateConfig(instance.id, {
      fullDurationMs: newMs,
      durationMs: newMs,
      running: false,
      startedAt: null,
    });
  };

  const start = () => {
    if (running) return;
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
      durationMs: remaining,
    });
  };
  const reset = () => {
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      durationMs: fullMs,
    });
  };

  const flash = !running && remaining === 0 && fullMs > 0;

  return (
    <div
      className="relative h-full w-full flex items-center justify-between p-3 gap-3"
      style={{ containerType: 'size' as const }}
    >
      <div
        className={
          'flex-1 min-w-0 flex items-center justify-center gap-1 overflow-hidden ' +
          (flash ? 'text-rose-500 animate-pulse' : '')
        }
      >
        <DigitColumn value={mTens} onAdjust={(d) => adjustDigit(0, d)} disabled={running} />
        <DigitColumn value={mOnes} onAdjust={(d) => adjustDigit(1, d)} disabled={running} />
        <span className={`font-bold ${DIGIT_SIZE} leading-none mx-0.5 mb-[2cqh]`}>
          :
        </span>
        <DigitColumn value={sTens} onAdjust={(d) => adjustDigit(2, d)} disabled={running} />
        <DigitColumn value={sOnes} onAdjust={(d) => adjustDigit(3, d)} disabled={running} />
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
        {!running ? (
          <button
            onClick={start}
            disabled={fullMs === 0}
            className={`rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white flex items-center justify-center shadow-sm transition-colors ${ROUND_BUTTON_SIZE}`}
            aria-label="Start"
            title="Start"
          >
            <Play className={`${PLAY_ICON_SIZE} ml-0.5`} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={pause}
            className={`rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-sm transition-colors ${ROUND_BUTTON_SIZE}`}
            aria-label="Pause"
            title="Pause"
          >
            <Pause className={PLAY_ICON_SIZE} fill="currentColor" />
          </button>
        )}
        <button
          onClick={reset}
          className={`rounded-full border border-slate-300 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors ${RESET_BUTTON_SIZE}`}
          aria-label="Reset"
          title="Reset"
        >
          <Square className={RESET_ICON_SIZE} />
        </button>
      </div>

      {/* Thin progress bar at the bottom (replaces the previous left-side ring). */}
      <div
        className="absolute left-0 right-0 bottom-0 h-1 bg-slate-100/60 pointer-events-none"
        aria-hidden
      >
        <div
          className="h-full bg-indigo-500"
          style={{
            width: `${Math.round(fraction * 100)}%`,
            transition: 'width 200ms linear',
          }}
        />
      </div>
    </div>
  );
}
