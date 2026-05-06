import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type Vote = 'up' | 'mid' | 'down';

export type ExitPollConfig = {
  up?: number;
  mid?: number;
  down?: number;
};

const OPTIONS: Array<{ key: Vote; icon: string; cls: string }> = [
  { key: 'up',   icon: '👍', cls: 'bg-emerald-500' },
  { key: 'mid',  icon: '😐', cls: 'bg-amber-500' },
  { key: 'down', icon: '👎', cls: 'bg-rose-500' },
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

  const tally = (v: Vote) => {
    updateConfig(instance.id, { [v]: counts[v] + 1 });
  };
  const reset = () => updateConfig(instance.id, { up: 0, mid: 0, down: 0 });

  return (
    <div
      className="h-full w-full flex flex-col p-2 gap-2"
      style={{ containerType: 'inline-size' as const }}
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
                'rounded-lg flex flex-col items-center justify-end p-2 text-white text-center hover:brightness-110 transition ' +
                o.cls
              }
            >
              <div className="text-[clamp(28px,16cqw,72px)] leading-none mb-1">{o.icon}</div>
              <div className="font-bold tabular-nums text-[clamp(20px,10cqw,42px)] leading-none">{n}</div>
              <div className="text-xs opacity-90">{pct}%</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Total votes: {total}</span>
        <button
          onClick={reset}
          disabled={total === 0}
          className="px-2 py-0.5 rounded hover:bg-slate-100 disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
