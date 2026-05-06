import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { parseNames, pickIndex } from './logic';

export type NamePickerConfig = {
  namesText?: string;
  removePicked?: boolean;
  picked?: string[];
};

const SPIN_TOTAL_MS = 1100;
const SPIN_INTERVAL_MS = 60;

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
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  const spin = () => {
    if (spinning) return;
    if (pool.length === 0) {
      setDisplay(removePicked && all.length > 0 ? '— all picked —' : '— add names —');
      return;
    }
    setSpinning(true);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= SPIN_TOTAL_MS) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const i = pickIndex(pool.length);
        const winner = pool[i];
        setDisplay(winner);
        setSpinning(false);
        if (removePicked) {
          updateConfig(instance.id, { picked: [...picked, winner] });
        }
        return;
      }
      setDisplay(pool[pickIndex(pool.length)]);
    }, SPIN_INTERVAL_MS);
  };

  const resetPicked = () => updateConfig(instance.id, { picked: [] });

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className={'font-bold text-center text-[clamp(20px,12cqw,72px)] ' + (spinning ? 'opacity-70' : '')}>
        {display ?? (pool.length === 0 ? '— add names —' : 'Tap "Pick"')}
      </div>
      <div className="flex gap-1">
        <button
          onClick={spin}
          disabled={spinning}
          className="px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm disabled:opacity-50"
        >
          Pick
        </button>
        {removePicked && picked.length > 0 && (
          <button
            onClick={resetPicked}
            className="px-3 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"
            title="Reset picked list"
          >
            Reset ({picked.length})
          </button>
        )}
      </div>
    </div>
  );
}
