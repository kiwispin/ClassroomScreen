import { Cog } from 'lucide-react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { DiceConfig } from '.';

export default function DiceSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as DiceConfig;
  const mode = cfg.mode ?? 'dice';

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Dice settings"
          title="Settings"
        ><Cog className="w-3.5 h-3.5" strokeWidth={2} /></button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-64">
          <div className="flex gap-1">
            <button
              onClick={() => updateConfig(instance.id, { mode: 'dice' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (mode === 'dice' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Dice
            </button>
            <button
              onClick={() => updateConfig(instance.id, { mode: 'range' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (mode === 'range' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Number range
            </button>
          </div>
          {mode === 'dice' ? (
            <label className="flex items-center justify-between gap-3">
              <span>Number of dice</span>
              <input
                type="number"
                min={1}
                max={8}
                value={cfg.count ?? 2}
                onChange={(e) =>
                  updateConfig(instance.id, { count: Number(e.target.value) })
                }
                className="w-16 border border-slate-300 rounded px-2 py-0.5"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <span>Min</span>
                <input
                  type="number"
                  value={cfg.min ?? 1}
                  onChange={(e) => updateConfig(instance.id, { min: Number(e.target.value) })}
                  className="w-20 border border-slate-300 rounded px-2 py-0.5"
                />
              </label>
              <label className="flex items-center gap-1">
                <span>Max</span>
                <input
                  type="number"
                  value={cfg.max ?? 100}
                  onChange={(e) => updateConfig(instance.id, { max: Number(e.target.value) })}
                  className="w-20 border border-slate-300 rounded px-2 py-0.5"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </SettingsPopover>
  );
}
