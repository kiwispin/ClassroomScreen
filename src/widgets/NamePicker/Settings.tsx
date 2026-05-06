import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { NamePickerConfig } from '.';

export default function NamePickerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NamePickerConfig;
  const namesText = cfg.namesText ?? '';
  const removePicked = cfg.removePicked ?? false;

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Name picker settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <label className="flex flex-col gap-1">
            <span>Names (one per line, or comma-separated)</span>
            <textarea
              rows={6}
              value={namesText}
              onChange={(e) => updateConfig(instance.id, { namesText: e.target.value })}
              placeholder={'Alice\nBob\nCarol'}
              className="border border-slate-300 rounded px-2 py-1 text-sm font-mono"
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Remove a name after picking</span>
            <input
              type="checkbox"
              checked={removePicked}
              onChange={(e) =>
                updateConfig(instance.id, {
                  removePicked: e.target.checked,
                  picked: e.target.checked ? (cfg.picked ?? []) : [],
                })
              }
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
