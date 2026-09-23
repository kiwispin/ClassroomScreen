import { Check, Palette } from 'lucide-react';
import SettingsPopover from './SettingsPopover';
import { useAppStore } from '../store/store';
import { THEMES } from '../lib/themes';
import { SettingsToggle } from './WidgetSettingsPanel';
import {
  DEFAULT_TIMER_GLASS_OPACITY,
  MAX_TIMER_GLASS_OPACITY,
  MIN_TIMER_GLASS_OPACITY,
} from '../widgets/Timer';

type Props = {
  instanceId: string;
  currentTheme?: string;
  timerGlass?: { enabled: boolean; opacity?: number };
};

export default function ThemePicker({ instanceId, currentTheme, timerGlass }: Props) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const active = currentTheme ?? 'default';
  const configuredOpacity = timerGlass?.opacity;
  const glassOpacity = Math.max(
    MIN_TIMER_GLASS_OPACITY,
    Math.min(
      MAX_TIMER_GLASS_OPACITY,
      Number.isFinite(configuredOpacity) ? configuredOpacity! : DEFAULT_TIMER_GLASS_OPACITY,
    ),
  );

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Color theme"
          title="Color theme"
        >
          <Palette className="w-4 h-4" strokeWidth={1.75} />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-2 w-[15rem]">
          <div className="text-xs font-medium uppercase text-slate-500">Color theme</div>
          <div className="grid grid-cols-4 gap-1.5">
            {THEMES.map((t) => {
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    updateConfig(instanceId, { theme: t.id });
                    close();
                  }}
                  className={
                    'relative rounded-lg p-1 border transition-all hover:scale-[1.04] ' +
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
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {timerGlass && (
            <div className="mt-1 border-t border-slate-200 pt-3">
              <SettingsToggle
                label="Frosted glass"
                checked={timerGlass.enabled}
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
                  min={MIN_TIMER_GLASS_OPACITY}
                  max={MAX_TIMER_GLASS_OPACITY}
                  step={5}
                  value={glassOpacity}
                  disabled={!timerGlass.enabled}
                  onChange={(event) => updateConfig(instanceId, { glassOpacity: Number(event.target.value) })}
                  className="block h-2 w-full cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </SettingsPopover>
  );
}
