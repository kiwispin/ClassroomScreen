import WidgetSettingsPanel, { SettingsSection } from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { QRCodeConfig } from '.';

export default function QRCodeSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as QRCodeConfig;

  return (
    <WidgetSettingsPanel
      title="QR settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="QR settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <SettingsSection title="Content">
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span>URL</span>
              <input
                type="url"
                value={cfg.url ?? ''}
                onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
                placeholder="https://example.com"
                className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>Caption (optional)</span>
              <input
                type="text"
                value={cfg.caption ?? ''}
                onChange={(e) => updateConfig(instance.id, { caption: e.target.value })}
                className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        </SettingsSection>
      )}
    </WidgetSettingsPanel>
  );
}
