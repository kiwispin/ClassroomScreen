import { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import {
  COLORS,
  COIN_SIDES,
  LETTERS,
  RPS,
  pickInRange,
  pickOne,
  rollDice,
  rollSided,
  type DiceMode,
} from './logic';

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

export function ColorFace({ color = '#c084fc', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="8" y="8" width="84" height="84" rx="8" fill="#f8fafc" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="26" fill={color} opacity="0.65" stroke="#a855f7" strokeWidth="4" />
    </svg>
  );
}

export function PolyDie({
  value,
  sides,
  className = '',
}: {
  value: number;
  sides: 12 | 20;
  className?: string;
}) {
  const facets =
    sides === 12
      ? [
          'M50 8 L72 16 L87 36 L80 64 L56 84 L28 78 L13 57 L17 30 Z',
          'M50 8 L50 35 L72 16 Z',
          'M50 35 L87 36 L72 16 Z',
          'M50 35 L80 64 L87 36 Z',
          'M50 35 L56 84 L80 64 Z',
          'M50 35 L28 78 L56 84 Z',
          'M50 35 L13 57 L28 78 Z',
          'M50 35 L17 30 L13 57 Z',
          'M50 35 L50 8 L17 30 Z',
        ]
      : [
          'M50 8 L87 32 L78 76 L50 94 L22 76 L13 32 Z',
          'M50 8 L50 48 L87 32 Z',
          'M50 8 L13 32 L50 48 Z',
          'M13 32 L22 76 L50 48 Z',
          'M87 32 L50 48 L78 76 Z',
          'M22 76 L50 94 L50 48 Z',
          'M78 76 L50 48 L50 94 Z',
          'M22 76 L78 76 L50 48 Z',
        ];
  const palette = ['#d1d5db', '#f8fafc', '#bfc5cb', '#e5e7eb', '#aeb4ba'];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden style={{ overflow: 'visible' }}>
      {facets.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={palette[i % palette.length]}
          stroke="#9ca3af"
          strokeWidth="0.8"
        />
      ))}
      <text
        x="50"
        y={sides === 12 ? '57' : '59'}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize="23"
        fontWeight="800"
      >
        {value}
      </text>
    </svg>
  );
}

export function CoinFace({ side = '1', className = '' }: { side?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="40" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="6" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="9 5" />
      {side === 'queen' ? (
        <>
          <path d="M32 63 Q50 76 68 63 L64 40 Q55 47 50 32 Q45 47 36 40 Z" fill="white" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="38" cy="37" r="3" fill="#0f172a" />
          <circle cx="50" cy="29" r="3" fill="#0f172a" />
          <circle cx="62" cy="37" r="3" fill="#0f172a" />
        </>
      ) : (
        <text x="50" y="57" textAnchor="middle" fill="#0f172a" fontSize="50" fontWeight="500">
          1
        </text>
      )}
    </svg>
  );
}

export function LetterFace({ value = 'A', className = '' }: { value?: string; className?: string }) {
  return (
    <div className={'flex items-center justify-center rounded-lg border-4 border-slate-950 bg-white font-bold text-slate-950 ' + className}>
      {value}
    </div>
  );
}

export function RpsFace({ value = 'rock', className = '' }: { value?: string; className?: string }) {
  const symbol = value === 'rock' ? '✊' : value === 'paper' ? '✋' : '✌';
  return (
    <div className={'flex items-center justify-center rounded-full border-4 border-slate-950 bg-white font-bold text-slate-950 ' + className}>
      {symbol}
    </div>
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
  const [colorValue, setColorValue] = useState(() => pickOne(COLORS));
  const [coinValue, setCoinValue] = useState(() => pickOne(COIN_SIDES));
  const [letterValue, setLetterValue] = useState(() => pickOne(LETTERS));
  const [rpsValue, setRpsValue] = useState<(typeof RPS)[number]>(() => pickOne(RPS));
  const [rolling, setRolling] = useState(false);
  const [revealedAt, setRevealedAt] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDice(rollDice(count));
  }, [count]);

  useEffect(() => {
    setRangeValue(pickInRange(min, max));
  }, [min, max]);

  useEffect(() => {
    if (mode === 'd12') setRangeValue(rollSided(12));
    if (mode === 'd20') setRangeValue(rollSided(20));
    if (mode === 'color') setColorValue(pickOne(COLORS));
    if (mode === 'coin') setCoinValue(pickOne(COIN_SIDES));
    if (mode === 'letter') setLetterValue(pickOne(LETTERS));
    if (mode === 'rps') setRpsValue(pickOne(RPS));
  }, [mode]);

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
      switch (mode) {
        case 'dice':
          setDice(rollDice(count));
          break;
        case 'd12':
          setRangeValue(rollSided(12));
          break;
        case 'd20':
          setRangeValue(rollSided(20));
          break;
        case 'color':
          setColorValue(pickOne(COLORS));
          break;
        case 'coin':
          setCoinValue(pickOne(COIN_SIDES));
          break;
        case 'letter':
          setLetterValue(pickOne(LETTERS));
          break;
        case 'rps':
          setRpsValue(pickOne(RPS));
          break;
        default:
          setRangeValue(pickInRange(min, max));
      }

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
      {mode === 'dice' && (
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
      )}

      {(mode === 'range' || mode === 'd12' || mode === 'd20') && (
        <div
          key={revealedAt}
          className={
            (rolling ? 'opacity-70 animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]')
          }
        >
          {mode === 'd12' ? (
            <PolyDie value={rangeValue} sides={12} className="w-[clamp(100px,min(54cqw,58cqh),240px)]" />
          ) : mode === 'd20' ? (
            <PolyDie value={rangeValue} sides={20} className="w-[clamp(100px,min(54cqw,58cqh),240px)]" />
          ) : (
            <div className="font-bold tabular-nums leading-none text-[clamp(40px,min(22cqw,56cqh),260px)]">
              {rangeValue}
            </div>
          )}
        </div>
      )}

      {mode === 'color' && (
        <div key={revealedAt} className={rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]'}>
          <ColorFace color={colorValue} className="w-[clamp(112px,min(58cqw,60cqh),260px)] text-slate-950" />
        </div>
      )}

      {mode === 'coin' && (
        <div key={revealedAt} className={rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]'}>
          <CoinFace side={coinValue} className="w-[clamp(112px,min(58cqw,60cqh),260px)]" />
        </div>
      )}

      {mode === 'letter' && (
        <div key={revealedAt} className={rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]'}>
          <LetterFace value={letterValue} className="h-[clamp(112px,min(58cqw,60cqh),260px)] w-[clamp(112px,min(58cqw,60cqh),260px)] text-[clamp(40px,min(20cqw,28cqh),120px)]" />
        </div>
      )}

      {mode === 'rps' && (
        <div key={revealedAt} className={rolling ? 'animate-[shake_120ms_linear_infinite]' : 'animate-[settle_350ms_ease-out]'}>
          <RpsFace value={rpsValue} className="h-[clamp(112px,min(58cqw,60cqh),260px)] w-[clamp(112px,min(58cqw,60cqh),260px)] text-[clamp(52px,min(28cqw,34cqh),150px)]" />
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
