import { Check, Palette } from 'lucide-react';
import WidgetSettingsPanel, { SettingsSection, SettingsToggle } from './WidgetSettingsPanel';
import { useAppStore } from '../store/store';
import { THEMES } from '../lib/themes';
import {
  DEFAULT_GLASS_OPACITY,
  MAX_GLASS_OPACITY,
  MIN_GLASS_OPACITY,
  normalizeGlassOpacity,
} from '../lib/widget-glass';

type Props = {
  instanceId: string;
  currentTheme?: string;
  glass?: { enabled: boolean; opacity?: number };
};

export default function ThemePicker({ instanceId, currentTheme, glass }: Props) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const active = currentTheme ?? 'default';
  const glassOpacity = normalizeGlassOpacity(glass?.opacity ?? DEFAULT_GLASS_OPACITY);

  return (
    <WidgetSettingsPanel
      title="Appearance"
      trigger={(toggle, open, panelId) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Color theme"
          title="Color theme"
        >
          <Palette className="w-4 h-4" strokeWidth={1.75} />
        </button>
      )}
    >
      {() => (
        <>
          <SettingsSection title="Colour theme">
          <div className="grid grid-cols-4 gap-1.5">
            {THEMES.map((t) => {
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    updateConfig(instanceId, { theme: t.id });
                  }}
                  className={
                    'relative min-w-0 rounded-lg p-1 border transition-all hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ' +
                    (isActive
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300')
                  }
                  title={t.name}
                  aria-label={t.name}
                  aria-pressed={isActive}
                >
                  <div
                    className="w-full h-10 rounded flex items-center justify-center"
                    style={{ background: t.bg }}
                  >
                    <div className="flex flex-col gap-1 items-center">
                      <div
                        className="w-7 h-1 rounded-full"
                        style={{ background: t.text, opacity: 0.85 }}
                      />
                      <div className="flex items-center gap-1">
                        <div
                          className="w-4 h-1 rounded-full"
                          style={{ background: t.accent }}
                        />
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{ background: t.text, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="mt-1 block truncate text-xs text-slate-700">{t.name}</span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          </SettingsSection>
          {glass && (
            <SettingsSection title="Background">
              <SettingsToggle
                label="Frosted glass"
                checked={glass.enabled}
                onChange={(enabled) => updateConfig(instanceId, { frostedGlass: enabled })}
              />
              <label className="mt-2 flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                <span className="flex items-center justify-between">
                  <span>Opacity</span>
                  <output>{glassOpacity}%</output>
                </span>
                <input
                  type="range"
                  aria-label="Glass opacity"
                  min={MIN_GLASS_OPACITY}
                  max={MAX_GLASS_OPACITY}
                  step={5}
                  value={glassOpacity}
                  disabled={!glass.enabled}
                  onChange={(event) => updateConfig(instanceId, { glassOpacity: Number(event.target.value) })}
                  className="block h-2 w-full cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
              <p className="text-xs text-slate-500">Increase opacity for clearer text over a busy background.</p>
            </SettingsSection>
          )}
        </>
      )}
    </WidgetSettingsPanel>
  );
}
