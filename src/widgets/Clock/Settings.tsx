import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
  analog?: boolean;
};

export default function ClockSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ClockConfig;
  const analog = cfg.analog ?? false;

  const Toggle = ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <label
      className={
        'flex items-center justify-between gap-3 ' +
        (disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')
      }
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Clock settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-2 w-56">
          <Toggle
            label="Analog face"
            value={analog}
            onChange={(v) => updateConfig(instance.id, { analog: v })}
          />
          <div className="border-t border-slate-200 my-1" />
          <Toggle
            label="24-hour"
            value={cfg.format24 ?? true}
            onChange={(v) => updateConfig(instance.id, { format24: v })}
            disabled={analog}
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
          {analog && (
            <p className="text-[11px] text-slate-500 mt-1">
              Show seconds adds a sweeping accent-coloured hand.
            </p>
          )}
        </div>
      )}
    </SettingsPopover>
  );
}
