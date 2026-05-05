import { useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { rollDice, pickInRange, DIE_GLYPHS, type DiceMode } from './logic';

export type DiceConfig = {
  mode?: DiceMode;
  count?: number;
  min?: number;
  max?: number;
};

export default function Dice({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as DiceConfig;
  const mode: DiceMode = cfg.mode ?? 'dice';
  const count = cfg.count ?? 2;
  const min = cfg.min ?? 1;
  const max = cfg.max ?? 100;

  const [dice, setDice] = useState<number[]>(() => rollDice(count));
  const [rangeValue, setRangeValue] = useState<number>(() => pickInRange(min, max));
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let n = 0;
    const id = window.setInterval(() => {
      if (mode === 'dice') setDice(rollDice(count));
      else setRangeValue(pickInRange(min, max));
      n += 1;
      if (n >= 8) {
        window.clearInterval(id);
        setRolling(false);
      }
    }, 70);
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      {mode === 'dice' ? (
        <div className="flex items-center justify-center flex-wrap gap-2 text-[clamp(40px,18cqw,128px)] leading-none">
          {dice.map((d, i) => (
            <span key={i} className="tabular-nums">{DIE_GLYPHS[d]}</span>
          ))}
        </div>
      ) : (
        <div className="font-bold tabular-nums text-[clamp(28px,18cqw,128px)]">
          {rangeValue}
        </div>
      )}
      <button
        onClick={roll}
        disabled={rolling}
        className="px-4 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm disabled:opacity-50"
      >
        Roll
      </button>
    </div>
  );
}
