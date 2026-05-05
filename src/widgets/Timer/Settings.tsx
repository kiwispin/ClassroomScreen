import { useState } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import { SFX_NAMES, playSfx, type SfxName } from '../../lib/audio';
import type { WidgetSettingsProps } from '../Demo/meta';
import { parseMmss, formatMmss } from './logic';
import type { TimerConfig } from '.';

export default function TimerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;
  const fullMs = cfg.fullDurationMs ?? 5 * 60_000;
  const [draft, setDraft] = useState(formatMmss(fullMs));
  const sfx: SfxName = cfg.sfx ?? 'bell';

  const commit = () => {
    const ms = parseMmss(draft);
    if (ms == null) {
      setDraft(formatMmss(fullMs));
      return;
    }
    updateConfig(instance.id, {
      fullDurationMs: ms,
      durationMs: ms,
      running: false,
      startedAt: null,
    });
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Timer settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span>Duration (MM:SS)</span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              className="border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Sound</span>
            <div className="flex gap-1 flex-wrap">
              {SFX_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    updateConfig(instance.id, { sfx: n });
                    playSfx(n);
                  }}
                  className={
                    'px-2 py-1 rounded text-xs ' +
                    (sfx === n ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Auto-reset on zero</span>
            <input
              type="checkbox"
              checked={cfg.autoReset ?? false}
              onChange={(e) => updateConfig(instance.id, { autoReset: e.target.checked })}
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
