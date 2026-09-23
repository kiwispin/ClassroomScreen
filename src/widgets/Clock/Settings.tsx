import WidgetSettingsPanel, {
  SettingsSection,
  SettingsToggle,
} from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
  analog?: boolean;
};

export default function ClockSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ClockConfig;
  const analog = cfg.analog ?? false;

  return (
    <WidgetSettingsPanel
      title="Clock settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton
          open={toggle}
          label="Clock settings"
          expanded={open}
          controls={panelId}
        />
      )}
    >
      {() => <>
        <SettingsSection title="Clock face">
          <fieldset>
            <legend className="sr-only">Clock face</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: 'Digital' },
                { value: true, label: 'Analog' },
              ].map((face) => (
                <label key={face.label} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`clock-face-${instance.id}`}
                    value={String(face.value)}
                    checked={analog === face.value}
                    onChange={() => updateConfig(instance.id, { analog: face.value })}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors peer-checked:border-indigo-400 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500">
                    {face.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </SettingsSection>

        <SettingsSection title="Time">
          <SettingsToggle
            label="24-hour time"
            checked={cfg.format24 ?? true}
            onChange={(format24) => updateConfig(instance.id, { format24 })}
            disabled={analog}
          />
          <SettingsToggle
            label="Show seconds"
            checked={cfg.showSeconds ?? false}
            onChange={(showSeconds) => updateConfig(instance.id, { showSeconds })}
            description={analog ? 'Adds a sweeping accent-coloured hand.' : undefined}
          />
        </SettingsSection>

        <SettingsSection title="Date">
          <SettingsToggle
            label="Show date"
            checked={cfg.showDate ?? true}
            onChange={(showDate) => updateConfig(instance.id, { showDate })}
          />
        </SettingsSection>
      </>}
    </WidgetSettingsPanel>
  );
}
