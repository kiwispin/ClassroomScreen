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

  const activeSymbol = active ? SYMBOLS.find((s) => s.key === active) ?? null : null;

  return (
    <div
      className="h-full w-full p-3"
      style={{ containerType: 'size' as const }}
    >
      {activeSymbol ? (
        <button
          onClick={() => updateConfig(instance.id, { active: null })}
          className="h-full w-full rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
          style={{
            background: 'color-mix(in srgb, var(--w-accent, #6366f1) 12%, transparent)',
          }}
          aria-label={`${activeSymbol.label} (click to clear)`}
          title="Click to clear"
        >
          <span
            className="leading-none"
            style={{ fontSize: 'min(60cqi, 60cqb)' }}
          >
            {activeSymbol.icon}
          </span>
          <span
            className="font-semibold"
            style={{ fontSize: 'min(8cqi, 9cqb)' }}
          >
            {activeSymbol.label}
          </span>
        </button>
      ) : (
        <div className="h-full w-full grid grid-cols-3 grid-rows-2 gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s.key}
              onClick={() => updateConfig(instance.id, { active: s.key })}
              className="rounded-lg flex flex-col items-center justify-center bg-slate-100/60 hover:bg-slate-200/70 transition-colors p-1 min-h-0"
              aria-label={s.label}
              title={s.label}
            >
              <span
                className="leading-none"
                style={{ fontSize: 'min(20cqi, 28cqb)' }}
              >
                {s.icon}
              </span>
              <span
                className="font-medium opacity-70 mt-1 truncate max-w-full"
                style={{ fontSize: 'min(3.5cqi, 5cqb)' }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
