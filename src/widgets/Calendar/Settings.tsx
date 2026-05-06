import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { CalendarConfig } from '.';

export default function CalendarSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as CalendarConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Calendar settings" />
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
