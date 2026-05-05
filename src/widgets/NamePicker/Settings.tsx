import { Cog } from 'lucide-react';
import SettingsPopover from '../../components/SettingsPopover';
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Name picker settings"
          title="Settings"
        ><Cog className="w-3.5 h-3.5" strokeWidth={2} /></button>
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
