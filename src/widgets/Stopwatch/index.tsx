import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { elapsedMs, formatStopwatch, type StopwatchState } from './logic';

export type StopwatchConfig = {
  running?: boolean;
  startedAt?: number | null;
  accumulatedMs?: number;
};

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
      className="h-full w-full flex flex-col items-center justify-center select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="font-bold tabular-nums text-[clamp(28px,16cqw,128px)]">
        {formatStopwatch(elapsed)}
      </div>
      <div className="flex gap-1">
        {!state.running ? (
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
