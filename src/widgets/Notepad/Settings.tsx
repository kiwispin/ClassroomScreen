import SettingsPopover from '../../components/SettingsPopover';
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
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Notepad settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-56">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Auto-fit text</span>
            <input
              type="checkbox"
              checked={autoFit}
              onChange={(e) =>
                updateConfig(instance.id, { autoFit: e.target.checked })
              }
            />
          </label>

          <div className={'flex flex-col gap-1 ' + (autoFit ? 'opacity-50' : '')}>
            <label className="flex items-center justify-between gap-3">
              <span>Font size</span>
              <span className="text-slate-500">{fontSize}px</span>
            </label>
            <input
              type="range"
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
      )}
    </SettingsPopover>
  );
}
