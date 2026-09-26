import WidgetSettingsPanel, { SettingsSection, SettingsToggle } from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { CalendarConfig } from '.';

export default function CalendarSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as CalendarConfig;

  return (
    <WidgetSettingsPanel
      title="Calendar settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="Calendar settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <SettingsSection title="Display">
            <SettingsToggle label="Show month grid" checked={cfg.showMonthGrid ?? false}
              onChange={(showMonthGrid) => updateConfig(instance.id, { showMonthGrid })} />
        </SettingsSection>
      )}
    </WidgetSettingsPanel>
  );
}
