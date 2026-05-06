import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { VideoEmbedConfig } from '.';

export default function VideoEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as VideoEmbedConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Video settings" />
      )}
    >
      {() => (
        <label className="flex flex-col gap-1 w-72">
          <span>YouTube URL</span>
          <input
            type="url"
            value={cfg.url ?? ''}
            onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </label>
      )}
    </SettingsPopover>
  );
}
