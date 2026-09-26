import WidgetSettingsPanel, { SettingsSection, SettingsToggle } from '../../components/WidgetSettingsPanel';
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
    <WidgetSettingsPanel
      title="Name picker settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="Name picker settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <>
        <SettingsSection title="Names">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span>Names (one per line, or comma-separated)</span>
              <textarea
                rows={6}
                value={namesText}
                onChange={(e) => updateConfig(instance.id, { namesText: e.target.value })}
                placeholder={'Alice\nBob\nCarol'}
                className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y"
              />
            </label>
          </div>
        </SettingsSection>
        <SettingsSection title="Picking">
            <SettingsToggle label="Remove a name after picking" checked={removePicked}
              onChange={(removePicked) => updateConfig(instance.id, {
                removePicked, picked: removePicked ? (cfg.picked ?? []) : [],
              })} />
        </SettingsSection>
        </>
      )}
    </WidgetSettingsPanel>
  );
}
