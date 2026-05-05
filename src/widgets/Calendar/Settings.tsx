import { Cog } from 'lucide-react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { CalendarConfig } from '.';

export default function CalendarSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as CalendarConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Calendar settings"
          title="Settings"
        ><Cog className="w-3.5 h-3.5" strokeWidth={2} /></button>
      )}
    >
      {() => (
        <label className="flex items-center justify-between gap-3 cursor-pointer w-56">
          <span>Show month grid</span>
          <input
            type="checkbox"
            checked={cfg.showMonthGrid ?? false}
            onChange={(e) =>
              updateConfig(instance.id, { showMonthGrid: e.target.checked })
            }
          />
        </label>
      )}
    </SettingsPopover>
  );
}
