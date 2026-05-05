import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { NoiseMeterConfig } from '.';

export default function NoiseMeterSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NoiseMeterConfig;
  const threshold = cfg.threshold ?? 0.5;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Noise meter settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2 w-64">
          <label className="flex items-center justify-between gap-3">
            <span>Loudness threshold</span>
            <span className="text-slate-500 tabular-nums">{Math.round(threshold * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(threshold * 100)}
            onChange={(e) =>
              updateConfig(instance.id, { threshold: Number(e.target.value) / 100 })
            }
          />
        </div>
      )}
    </SettingsPopover>
  );
}
