import WidgetSettingsPanel, { SettingsSection } from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { VideoEmbedConfig } from '.';

export default function VideoEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as VideoEmbedConfig;

  return (
    <WidgetSettingsPanel
      title="Video settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="Video settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <SettingsSection title="Video">
          <label className="flex flex-col gap-1">
            <span>YouTube URL</span>
            <input
              type="url"
              value={cfg.url ?? ''}
              onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </SettingsSection>
      )}
    </WidgetSettingsPanel>
  );
}
