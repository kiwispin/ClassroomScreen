import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
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
        <SettingsTriggerButton open={open} label="Noise meter settings" />
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
