import WidgetSettingsPanel, { SettingsSection, SettingsToggle } from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type NotepadConfig = { text?: string; fontSize?: number; autoFit?: boolean };

export default function NotepadSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const autoFit = cfg.autoFit ?? true;
  const fontSize = cfg.fontSize ?? 24;

  return (
    <WidgetSettingsPanel
      title="Notepad settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="Notepad settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <SettingsSection title="Text size">
          <div className="flex flex-col gap-3">
            <SettingsToggle label="Auto-fit text" checked={autoFit}
              onChange={(autoFit) => updateConfig(instance.id, { autoFit })} />

            <div className={'flex flex-col gap-1 ' + (autoFit ? 'opacity-50' : '')}>
              <label className="flex items-center justify-between gap-3">
                <span>Font size</span>
                <span className="text-slate-500">{fontSize}px</span>
              </label>
              <input
                type="range"
                aria-label="Font size"
                className="w-full accent-indigo-500"
                min={12}
                max={48}
                step={1}
                disabled={autoFit}
                value={fontSize}
                onChange={(e) =>
                  updateConfig(instance.id, { fontSize: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </SettingsSection>
      )}
    </WidgetSettingsPanel>
  );
}
