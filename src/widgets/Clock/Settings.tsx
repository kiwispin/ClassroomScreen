import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
};

export default function ClockSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ClockConfig;

  const Toggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Clock settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2">
          <Toggle
            label="24-hour"
            value={cfg.format24 ?? true}
            onChange={(v) => updateConfig(instance.id, { format24: v })}
          />
          <Toggle
            label="Show seconds"
            value={cfg.showSeconds ?? false}
            onChange={(v) => updateConfig(instance.id, { showSeconds: v })}
          />
          <Toggle
            label="Show date"
            value={cfg.showDate ?? true}
            onChange={(v) => updateConfig(instance.id, { showDate: v })}
          />
        </div>
      )}
    </SettingsPopover>
  );
}
