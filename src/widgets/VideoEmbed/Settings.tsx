import { Cog } from 'lucide-react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { VideoEmbedConfig } from '.';

export default function VideoEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as VideoEmbedConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Video settings"
          title="Settings"
        ><Cog className="w-3.5 h-3.5" strokeWidth={2} /></button>
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
