import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { QRCodeConfig } from '.';

export default function QRCodeSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as QRCodeConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="QR settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2 w-72">
          <label className="flex flex-col gap-1">
            <span>URL</span>
            <input
              type="url"
              value={cfg.url ?? ''}
              onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
              placeholder="https://example.com"
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Caption (optional)</span>
            <input
              type="text"
              value={cfg.caption ?? ''}
              onChange={(e) => updateConfig(instance.id, { caption: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
