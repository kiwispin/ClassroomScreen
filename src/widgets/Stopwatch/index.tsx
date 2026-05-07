import { useEffect, useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { elapsedMs, formatStopwatch, type StopwatchState } from './logic';

export type StopwatchConfig = {
  running?: boolean;
  startedAt?: number | null;
  accumulatedMs?: number;
};

const DIGIT_SIZE = 'text-[clamp(36px,min(18cqw,46cqh),280px)]';
// Play/Pause and Reset share diameter; Reset icon a touch smaller inside.
const BTN_SIZE = 'w-[clamp(36px,min(11cqw,28cqh),96px)] h-[clamp(36px,min(11cqw,28cqh),96px)]';
const PLAY_ICON_SIZE = 'w-[clamp(12px,min(3.6cqw,9cqh),34px)] h-[clamp(12px,min(3.6cqw,9cqh),34px)]';
const RESET_BTN_SIZE = BTN_SIZE;
const RESET_ICON_SIZE = 'w-[clamp(11px,min(2.9cqw,7cqh),26px)] h-[clamp(11px,min(2.9cqw,7cqh),26px)]';

export default function Stopwatch({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as StopwatchConfig;
  const state: StopwatchState = {
    running: cfg.running ?? false,
    startedAt: cfg.startedAt ?? null,
    accumulatedMs: cfg.accumulatedMs ?? 0,
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [state.running]);

  const elapsed = elapsedMs(state, now);

  const start = () => {
    if (state.running) return;
    updateConfig(instance.id, { running: true, startedAt: Date.now() });
  };
  const pause = () => {
    if (!state.running) return;
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      accumulatedMs: elapsed,
    });
  };
  const reset = () => {
    updateConfig(instance.id, { running: false, startedAt: null, accumulatedMs: 0 });
  };

  return (
    <div
      className="relative h-full w-full flex items-center justify-between p-3 gap-3"
      style={{ containerType: 'size' as const }}
    >
      <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
        <div className={`font-bold tabular-nums leading-none ${DIGIT_SIZE}`}>
          {formatStopwatch(elapsed)}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
        {!state.running ? (
          <button
            onClick={start}
            className={`rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 text-white flex items-center justify-center transition-colors ${BTN_SIZE}`}
            aria-label="Start"
            title="Start"
          >
            <Play className={`${PLAY_ICON_SIZE} ml-0.5`} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={pause}
            className={`rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors ${BTN_SIZE}`}
            aria-label="Pause"
            title="Pause"
          >
            <Pause className={PLAY_ICON_SIZE} fill="currentColor" />
          </button>
        )}
        <button
          onClick={reset}
          className={`rounded-full border border-slate-300 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors ${RESET_BTN_SIZE}`}
          aria-label="Reset"
          title="Reset"
        >
          <Square className={RESET_ICON_SIZE} />
        </button>
      </div>
    </div>
  );
}
