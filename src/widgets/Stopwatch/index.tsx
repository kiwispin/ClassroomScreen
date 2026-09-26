import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { elapsedMs, formatStopwatch, type StopwatchState } from './logic';

export type StopwatchConfig = {
  running?: boolean;
  startedAt?: number | null;
  accumulatedMs?: number;
};

const DIGIT_SIZE = 'text-[min(23cqw,57cqh)]';
const HOUR_DIGIT_SIZE = 'text-[min(16cqw,57cqh)]';
// Play/Pause and Reset share diameter; Reset icon a touch smaller inside.
const BTN_SIZE = 'w-[clamp(36px,min(11cqw,23cqh),96px)] h-[clamp(36px,min(11cqw,23cqh),96px)]';
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
    const id = setInterval(() => setNow(Date.now()), 33);
    return () => clearInterval(id);
  }, [state.running]);

  const elapsed = elapsedMs(state, now);

  const start = () => {
    if (state.running) return;
    setNow(Date.now());
    updateConfig(instance.id, { running: true, startedAt: Date.now() });
  };
  const pause = () => {
    if (!state.running) return;
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      accumulatedMs: elapsedMs(state, Date.now()),
    });
  };
  const reset = () => {
    updateConfig(instance.id, { running: false, startedAt: null, accumulatedMs: 0 });
  };

  return (
    <div
      className="relative h-full w-full"
      role="group" aria-label="Stopwatch"
      style={{ containerType: 'size' as const }}
    >
      <div className="absolute inset-x-[5%] top-[5%] bottom-[29%] flex items-center justify-center">
        <div className={`flex items-baseline font-normal tabular-nums leading-none tracking-tight whitespace-nowrap ${elapsed >= 3_600_000 ? HOUR_DIGIT_SIZE : DIGIT_SIZE}`}>
          <span>{formatStopwatch(elapsed)}</span><span className="text-[0.46em] tracking-normal">.{Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="absolute bottom-[8%] left-[6%] right-[6%] flex items-center justify-between">
        {!state.running ? (
          <button
            onClick={start}
            className={`rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${BTN_SIZE}`}
            aria-label="Start"
            title="Start"
          >
            <Play className={`${PLAY_ICON_SIZE} ml-0.5`} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={pause}
            className={`rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${BTN_SIZE}`}
            aria-label="Pause"
            title="Pause"
          >
            <Pause className={PLAY_ICON_SIZE} fill="currentColor" />
          </button>
        )}
        <button
          onClick={reset}
          className={`rounded-full border border-slate-300 hover:bg-slate-400/20 text-current flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${RESET_BTN_SIZE}`}
          aria-label="Reset"
          title="Reset"
        >
          <RotateCcw className={RESET_ICON_SIZE} />
        </button>
      </div>
    </div>
  );
}
