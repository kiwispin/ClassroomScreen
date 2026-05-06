import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type WorkSymbolKey = 'silent' | 'whisper' | 'partner' | 'group' | 'hand' | 'noaccess';

export type WorkSymbolsConfig = { active?: WorkSymbolKey | null };

const SYMBOLS: Array<{ key: WorkSymbolKey; icon: string; label: string }> = [
  { key: 'silent',   icon: '🤫', label: 'Silent' },
  { key: 'whisper',  icon: '🗣️', label: 'Whisper' },
  { key: 'partner',  icon: '👥', label: 'Partner' },
  { key: 'group',    icon: '👨‍👩‍👧‍👦', label: 'Group' },
  { key: 'hand',     icon: '✋', label: 'Hands up' },
  { key: 'noaccess', icon: '🚫', label: 'No talking' },
];

export default function WorkSymbols({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as WorkSymbolsConfig;
  const active = cfg.active ?? null;

  return (
    <div className="h-full w-full grid grid-cols-3 gap-2 p-2 ">
      {SYMBOLS.map((s) => {
        const on = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() =>
              updateConfig(instance.id, { active: on ? null : s.key })
            }
            className={
              'rounded-lg flex flex-col items-center justify-center text-3xl transition-all p-1 ' +
              (on
                ? 'bg-slate-700 text-white shadow-inner'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 opacity-70')
            }
            aria-label={s.label}
            aria-pressed={on}
            title={s.label}
          >
            <span>{s.icon}</span>
            <span className="text-[10px] font-medium mt-1">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
