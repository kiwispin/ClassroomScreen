import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type Vote = 'up' | 'mid' | 'down';

export type ExitPollConfig = {
  up?: number;
  mid?: number;
  down?: number;
};

const OPTIONS: Array<{
  key: Vote;
  icon: string;
  bg: string;
  hoverBg: string;
  bar: string;
}> = [
  { key: 'up',   icon: '👍', bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', bar: 'bg-emerald-500' },
  { key: 'mid',  icon: '😐', bg: 'bg-amber-500',   hoverBg: 'hover:bg-amber-600',   bar: 'bg-amber-500' },
  { key: 'down', icon: '👎', bg: 'bg-rose-500',    hoverBg: 'hover:bg-rose-600',    bar: 'bg-rose-500' },
];

export default function ExitPoll({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ExitPollConfig;
  const counts: Record<Vote, number> = {
    up: cfg.up ?? 0,
    mid: cfg.mid ?? 0,
    down: cfg.down ?? 0,
  };
  const total = counts.up + counts.mid + counts.down;

  const tally = (v: Vote) =>
    updateConfig(instance.id, { [v]: counts[v] + 1 });
  const reset = () => updateConfig(instance.id, { up: 0, mid: 0, down: 0 });

  return (
    <div
      className="h-full w-full flex flex-col p-3 gap-2"
      style={{ containerType: 'size' as const }}
    >
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {OPTIONS.map((o) => {
          const n = counts[o.key];
          const pct = total === 0 ? 0 : Math.round((n / total) * 100);
          return (
            <button
              key={o.key}
              onClick={() => tally(o.key)}
              className={
                'rounded-xl flex flex-col items-center justify-center text-white text-center transition-all active:scale-95 ' +
                o.bg + ' ' + o.hoverBg
              }
              aria-label={`Vote ${o.key}`}
            >
              <div
                className="leading-none mb-2"
                style={{ fontSize: 'min(34cqi, 30cqb)' }}
              >
                {o.icon}
              </div>
              <div
                className="font-bold tabular-nums leading-none"
                style={{ fontSize: 'min(16cqi, 18cqb)' }}
              >
                {n}
              </div>
              <div
                className="opacity-80 tabular-nums mt-1"
                style={{ fontSize: 'min(5cqi, 6cqb)' }}
              >
                {pct}%
              </div>
            </button>
          );
        })}
      </div>

      {total > 0 && (
        <div
          className="h-1.5 w-full rounded-full bg-slate-200/60 overflow-hidden flex"
          aria-hidden
        >
          {OPTIONS.map((o) => {
            const w = total === 0 ? 0 : (counts[o.key] / total) * 100;
            if (w === 0) return null;
            return (
              <div
                key={o.key}
                className={'h-full ' + o.bar}
                style={{ width: `${w}%`, transition: 'width 200ms linear' }}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between text-xs opacity-60">
        <span>
          {total === 0 ? 'No votes yet' : `${total} vote${total === 1 ? '' : 's'}`}
        </span>
        <button
          onClick={reset}
          disabled={total === 0}
          className="px-2 py-0.5 rounded hover:bg-slate-100/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
