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
  if (sides === 20) {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden style={{ overflow: 'visible' }}>
        <polygon points="60,6 104,31 104,89 60,114 16,89 16,31" fill="#eef1f4" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="60,6 82,31 60,42" fill="#c4c9d0" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="60,6 60,42 38,31" fill="#dbe0e5" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="38,31 60,42 44,56 16,31" fill="#e8ebef" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="82,31 104,31 76,56 60,42" fill="#b8bec6" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="16,31 44,56 32,78 16,89" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="104,31 104,89 88,78 76,56" fill="#d0d5db" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="44,56 60,42 76,56 70,82 50,82" fill="#fafafa" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="32,78 44,56 50,82 60,114" fill="#c7ccd3" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="88,78 60,114 70,82 76,56" fill="#b7bdc5" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="32,78 60,114 16,89" fill="#d9dde2" stroke="#94a3b8" strokeWidth="0.9" />
        <polygon points="88,78 104,89 60,114" fill="#e7eaee" stroke="#94a3b8" strokeWidth="0.9" />
        <text x="60" y="66" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="24" fontWeight="800">
          {value}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden style={{ overflow: 'visible' }}>
      <polygon points="60,22 88,32 101,51 100,72 86,92 60,102 34,92 20,72 19,51 32,32" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="60,22 88,32 101,51 79,47 60,38" fill="#c4c9cf" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="60,22 60,38 41,47 19,51 32,32" fill="#d8dde2" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="19,51 41,47 34,66 20,72" fill="#f1f3f5" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="101,51 100,72 86,66 79,47" fill="#e5e8eb" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="34,66 41,47 60,38 79,47 86,66 74,80 46,80" fill="#fafafa" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="20,72 34,66 46,80 34,92" fill="#dfe3e8" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="100,72 86,66 74,80 86,92" fill="#d5dae0" stroke="#94a3b8" strokeWidth="0.75" />
      <polygon points="34,92 46,80 74,80 86,92 60,102" fill="#b8bec5" stroke="#94a3b8" strokeWidth="0.75" />
      <text x="60" y="64" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="31" fontWeight="800">
        {value}
      </text>
    </svg>
  );
}

export function CoinFace({ side = 'heads', className = '' }: { side?: string; className?: string }) {
  const isHeads = side === 'heads';

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden style={{ overflow: 'visible' }}>
      <circle cx="60" cy="60" r="48" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="7" />
      <circle cx="60" cy="60" r="41" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="11 6" />
      {isHeads ? (
        <>
          <path d="M44 74 C36 61 39 40 55 33 C68 28 79 37 80 50 C81 59 75 65 69 69 L72 84 C61 89 49 85 44 74 Z" fill="white" stroke="#0f172a" strokeWidth="3.3" strokeLinejoin="round" />
          <path d="M54 37 C54 28 61 25 67 26 C73 27 77 32 78 38" fill="none" stroke="#0f172a" strokeWidth="3.3" strokeLinecap="round" />
          <path d="M49 57 C55 60 61 58 66 53" fill="none" stroke="#0f172a" strokeWidth="2.7" strokeLinecap="round" />
          <circle cx="65" cy="45" r="2.3" fill="#0f172a" />
          <path d="M42 85 L77 85" fill="none" stroke="#0f172a" strokeWidth="3.3" strokeLinecap="round" />
        </>
      ) : (
        <text x="60" y="78" textAnchor="middle" fill="#0f172a" fontSize="68" fontWeight="400" fontFamily="Georgia, serif">
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
