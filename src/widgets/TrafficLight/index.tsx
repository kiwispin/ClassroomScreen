import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type TrafficLightConfig = { active?: 'red' | 'yellow' | 'green' };

const COLORS: Array<{
  key: 'red' | 'yellow' | 'green';
  on: string;
  off: string;
}> = [
  { key: 'red',    on: 'bg-red-500',    off: 'bg-red-200' },
  { key: 'yellow', on: 'bg-yellow-400', off: 'bg-yellow-100' },
  { key: 'green',  on: 'bg-green-500',  off: 'bg-green-200' },
];

export default function TrafficLight({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TrafficLightConfig;
  const active = cfg.active ?? 'red';

  return (
    <div
      className="h-full w-full flex items-center justify-center bg-slate-900 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="flex flex-col gap-2 items-center justify-center h-full">
        {COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => updateConfig(instance.id, { active: c.key })}
            className={
              'rounded-full transition-all ' +
              (active === c.key
                ? c.on + ' shadow-[0_0_24px_rgba(255,255,255,0.45)]'
                : c.off + ' opacity-60')
            }
            style={{
              width: 'min(28cqw, 72px)',
              height: 'min(28cqw, 72px)',
            }}
            aria-label={c.key}
            aria-pressed={active === c.key}
          />
        ))}
      </div>
    </div>
  );
}
