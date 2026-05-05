import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { playSfx, type SfxName } from '../../lib/audio';
import { playCustomAudio } from '../../lib/audio-storage';
import { formatMmss, remainingMs, type TimerState } from './logic';

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

export default function Timer({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;

  const durationMs = cfg.durationMs ?? 5 * 60_000;
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
          durationMs: cfg.fullDurationMs ?? cfg.durationMs ?? 5 * 60_000,
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
  }, [running, atZero, sfx, customSoundId, autoReset, instance.id, updateConfig, cfg.fullDurationMs, cfg.durationMs]);

  const start = () => {
    if (running) return;
    if (remaining <= 0) {
      const full = cfg.fullDurationMs ?? 5 * 60_000;
      updateConfig(instance.id, { running: true, durationMs: full, startedAt: Date.now() });
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
      durationMs: cfg.fullDurationMs ?? cfg.durationMs ?? 5 * 60_000,
    });
  };

  const flash = !running && remaining === 0;

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div
        className={
          'font-bold tabular-nums text-[clamp(28px,18cqw,128px)] ' +
          (flash ? 'text-red-500 animate-pulse' : '')
        }
      >
        {formatMmss(remaining)}
      </div>
      <div className="flex gap-1">
        {!running ? (
          <button
            onClick={start}
            className="px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-sm"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-3 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
