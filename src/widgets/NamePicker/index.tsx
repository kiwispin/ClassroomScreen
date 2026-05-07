import { useEffect, useRef, useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { parseNames, pickIndex } from './logic';

export type NamePickerConfig = {
  namesText?: string;
  removePicked?: boolean;
  picked?: string[];
};

const SPIN_TOTAL_MS = 1400;

// Quick-then-slow tick spacing for a slot-machine reveal.
// `t` is 0..1. Interval grows from ~40ms to ~220ms.
const tickInterval = (t: number) => 40 + Math.pow(t, 2.4) * 180;

export default function NamePicker({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NamePickerConfig;
  const namesText = cfg.namesText ?? '';
  const removePicked = cfg.removePicked ?? false;
  const picked = cfg.picked ?? [];

  const all = parseNames(namesText);
  const pool = removePicked ? all.filter((n) => !picked.includes(n)) : all;

  const [display, setDisplay] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealedAt, setRevealedAt] = useState(0); // bump to retrigger the settle animation
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const spin = () => {
    if (spinning) return;
    if (pool.length === 0) {
      setDisplay(removePicked && all.length > 0 ? '— all picked —' : '— add names —');
      return;
    }
    setSpinning(true);
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / SPIN_TOTAL_MS);

      if (elapsed >= SPIN_TOTAL_MS) {
        const i = pickIndex(pool.length);
        const winner = pool[i];
        setDisplay(winner);
        setSpinning(false);
        setRevealedAt((n) => n + 1);
        if (removePicked) {
          updateConfig(instance.id, { picked: [...picked, winner] });
        }
        return;
      }
      setDisplay(pool[pickIndex(pool.length)]);
      timerRef.current = window.setTimeout(tick, tickInterval(t));
    };
    tick();
  };

  const resetPicked = () => updateConfig(instance.id, { picked: [] });

  const empty = pool.length === 0;

  return (
    <div
      className="relative h-full w-full flex flex-col items-center justify-center select-none p-3 gap-3"
      style={{ containerType: 'size' as const }}
    >
      <div
        key={revealedAt}
        className={
          'font-bold text-center leading-tight transition-opacity break-words ' +
          'text-[clamp(20px,min(13cqw,28cqh),120px)] ' +
          (spinning ? 'opacity-70 blur-[0.5px]' : 'opacity-100 animate-[settle_400ms_ease-out]')
        }
        style={{
          maxWidth: '100%',
        }}
      >
        {display ?? (empty ? '— add names —' : 'Tap to pick')}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={spin}
          disabled={spinning || empty}
          className={
            'rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors ' +
            'gap-1.5 px-[clamp(10px,min(3.5cqw,8cqh),24px)] py-[clamp(6px,min(2cqw,5cqh),12px)] ' +
            'text-[clamp(13px,min(3cqw,7cqh),22px)] font-medium'
          }
          aria-label="Pick a name"
          title="Pick a name"
        >
          <Shuffle
            className="w-[clamp(14px,min(3.2cqw,7.5cqh),22px)] h-[clamp(14px,min(3.2cqw,7.5cqh),22px)]"
            strokeWidth={2.25}
          />
          <span>Pick</span>
        </button>

        {removePicked && picked.length > 0 && (
          <button
            onClick={resetPicked}
            className="flex items-center gap-1 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors px-3 py-1.5 text-xs"
            title="Reset picked list"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Reset ({picked.length})</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes settle {
          0%   { transform: scale(0.9); opacity: 0; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
