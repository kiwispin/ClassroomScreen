import { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { rollDice, pickInRange, type DiceMode } from './logic';

export type DiceConfig = {
  mode?: DiceMode;
  count?: number;
  min?: number;
  max?: number;
};

const ROLL_TOTAL_MS = 900;
const tickInterval = (t: number) => 50 + Math.pow(t, 2.2) * 160;

type DieFaceProps = {
  value: number;
  className?: string;
  soft?: boolean;
};

const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
};

export function DieFace({ value, className = '', soft = false }: DieFaceProps) {
  const pips = PIP_POSITIONS[Math.max(1, Math.min(6, value))] ?? PIP_POSITIONS[1];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <rect
        x="7"
        y="7"
        width="86"
        height="86"
        rx="11"
        fill={soft ? '#f8fafc' : 'white'}
        stroke="currentColor"
        strokeWidth="4"
      />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill="currentColor" />
      ))}
    </svg>
  );
}

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

  useEffect(() => {
    setDice(rollDice(count));
  }, [count]);

  useEffect(() => {
    setRangeValue(pickInRange(min, max));
  }, [min, max]);

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
            'flex max-w-full items-center justify-center leading-none transition-transform ' +
            'gap-[clamp(8px,min(3cqw,5cqh),22px)] ' +
            (count > 2 ? 'flex-wrap' : '') + ' ' +
            (rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]')
          }
          style={{ color: 'var(--w-text, #0f172a)' }}
        >
          {dice.map((d, i) => (
            <DieFace
              key={i}
              value={d}
              soft
              className={
                count === 1
                  ? 'w-[clamp(112px,min(58cqw,60cqh),260px)]'
                  : 'w-[clamp(72px,min(32cqw,38cqh),150px)]'
              }
            />
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
          'rounded-full bg-[var(--w-accent,#6366f1)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-sm ' +
          'h-[clamp(46px,min(15cqw,15cqh),76px)] w-[clamp(46px,min(15cqw,15cqh),76px)]'
        }
        aria-label="Roll"
        title="Roll"
      >
        <Dices
          className="w-[clamp(24px,min(7cqw,7cqh),38px)] h-[clamp(24px,min(7cqw,7cqh),38px)]"
          strokeWidth={2.25}
        />
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
