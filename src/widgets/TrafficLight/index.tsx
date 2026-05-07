import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type TrafficLightConfig = { active?: 'red' | 'yellow' | 'green' };

type Color = {
  key: 'red' | 'yellow' | 'green';
  on: string;
  off: string;
  glow: string;
};

const COLORS: Color[] = [
  { key: 'red',    on: 'bg-red-500',    off: 'bg-red-900',    glow: 'rgba(239,68,68,0.55)' },
  { key: 'yellow', on: 'bg-amber-400',  off: 'bg-amber-900',  glow: 'rgba(251,191,36,0.55)' },
  { key: 'green',  on: 'bg-emerald-500',off: 'bg-emerald-900',glow: 'rgba(16,185,129,0.55)' },
];

export default function TrafficLight({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TrafficLightConfig;
  const active = cfg.active ?? 'red';

  return (
    <div
      className="h-full w-full flex items-center justify-center p-3"
      style={{ containerType: 'size' as const }}
    >
      {/* Dark "pole" stays dark regardless of theme so the lights always pop;
          the theme's tile bg shows around it. */}
      <div
        className="flex flex-col items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-white/10"
        style={{
          padding: 'min(4cqi,4cqb)',
          gap: 'min(3cqi,3cqb)',
        }}
      >
        {COLORS.map((c) => {
          const on = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => updateConfig(instance.id, { active: c.key })}
              className={
                'rounded-full transition-all duration-200 ' +
                (on ? c.on : c.off + ' opacity-60')
              }
              style={{
                width: 'min(60cqi,22cqb)',
                height: 'min(60cqi,22cqb)',
                boxShadow: on ? `0 0 calc(min(8cqi,8cqb)) ${c.glow}` : 'none',
              }}
              aria-label={c.key}
              aria-pressed={on}
            />
          );
        })}
      </div>
    </div>
  );
}
