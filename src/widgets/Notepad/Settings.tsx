import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type NotepadConfig = { text?: string; fontSize?: number };

export default function NotepadSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const fontSize = cfg.fontSize ?? 16;

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Notepad settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-3">
            <span>Font size</span>
            <span className="text-slate-500">{fontSize}px</span>
          </label>
          <input
            type="range"
            min={12}
            max={48}
            step={1}
            value={fontSize}
            onChange={(e) =>
              updateConfig(instance.id, { fontSize: Number(e.target.value) })
            }
          />
        </div>
      )}
    </SettingsPopover>
  );
}
