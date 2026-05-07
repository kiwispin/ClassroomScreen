import { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { rollDice, pickInRange, DIE_GLYPHS, type DiceMode } from './logic';

export type DiceConfig = {
  mode?: DiceMode;
  count?: number;
  min?: number;
  max?: number;
};

const ROLL_TOTAL_MS = 900;
const tickInterval = (t: number) => 50 + Math.pow(t, 2.2) * 160;

export default function Dice({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as DiceConfig;
  const mode: DiceMode = cfg.mode ?? 'dice';
  const count = cfg.count ?? 2;
  const min = cfg.min ?? 1;
  const max = cfg.max ?? 100;

  const [dice, setDice] = useState<number[]>(() => rollDice(count));
  const [rangeValue, setRangeValue] = useState<number>(() => pickInRange(min, max));
  const [rolling, setRolling] = useState(false);
  const [revealedAt, setRevealedAt] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / ROLL_TOTAL_MS);
      if (mode === 'dice') setDice(rollDice(count));
      else setRangeValue(pickInRange(min, max));

      if (elapsed >= ROLL_TOTAL_MS) {
        setRolling(false);
        setRevealedAt((n) => n + 1);
        return;
      }
      timerRef.current = window.setTimeout(tick, tickInterval(t));
    };
    tick();
  };

  return (
    <div
      className="relative h-full w-full flex flex-col items-center justify-center select-none p-3 gap-3"
      style={{ containerType: 'size' as const }}
    >
      {mode === 'dice' ? (
        <div
          key={revealedAt}
          className={
            'flex items-center justify-center flex-wrap leading-none transition-transform ' +
            'gap-[clamp(4px,min(2cqw,4cqh),16px)] ' +
            'text-[clamp(40px,min(20cqw,52cqh),260px)] ' +
            (rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]')
          }
        >
          {dice.map((d, i) => (
            <span
              key={i}
              className="tabular-nums"
              style={{ color: 'var(--w-accent, #6366f1)' }}
            >
              {DIE_GLYPHS[d]}
            </span>
          ))}
        </div>
      ) : (
        <div
          key={revealedAt}
          className={
            'font-bold tabular-nums leading-none transition-transform ' +
            'text-[clamp(40px,min(22cqw,56cqh),260px)] ' +
            (rolling ? 'opacity-70 animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]')
          }
        >
          {rangeValue}
        </div>
      )}

      <button
        onClick={roll}
        disabled={rolling}
        className={
          'rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors ' +
          'gap-1.5 px-[clamp(10px,min(3.5cqw,7cqh),24px)] py-[clamp(6px,min(2cqw,4.5cqh),12px)] ' +
          'text-[clamp(13px,min(3cqw,6.5cqh),22px)] font-medium'
        }
        aria-label="Roll"
        title="Roll"
      >
        <Dices
          className="w-[clamp(14px,min(3.5cqw,7cqh),24px)] h-[clamp(14px,min(3.5cqw,7cqh),24px)]"
          strokeWidth={2.25}
        />
        <span>Roll</span>
      </button>

      <style>{`
        @keyframes shake {
          0%   { transform: rotate(-2deg) translateY(0); }
          25%  { transform: rotate(2deg) translateY(-1px); }
          50%  { transform: rotate(-1deg) translateY(0); }
          75%  { transform: rotate(1deg) translateY(-1px); }
          100% { transform: rotate(-2deg) translateY(0); }
        }
        @keyframes settle {
          0%   { transform: scale(0.85); }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
