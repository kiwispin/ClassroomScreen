import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Dices } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { COLOR_NAMES, normalizeCount, rollValues, type DiceMode } from './logic';
import { CoinFace, ColorFace, DieFace, LetterFace, PolyDie, RpsFace } from './faces';
import { playDiceRoll } from '../../lib/audio';
export { CoinFace, ColorFace, DieFace, LetterFace, PolyDie, RpsFace } from './faces';

export const DICE_PALETTES = [
  { name: 'Classic', ink: '#18202e', fill: '#f8fafc' },
  { name: 'Violet', ink: '#5b21b6', fill: '#ede9fe' },
  { name: 'Ocean', ink: '#075985', fill: '#e0f2fe' },
  { name: 'Rose', ink: '#9f1239', fill: '#ffe4e6' },
  { name: 'Forest', ink: '#166534', fill: '#dcfce7' },
  { name: 'Amber', ink: '#92400e', fill: '#fef3c7' },
];
export type DiceConfig = {
  mode?: DiceMode; count?: number; min?: number; max?: number;
  sound?: boolean; showTotal?: boolean; diceColor?: string;
};

export default function Dice({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as DiceConfig;
  const mode = cfg.mode ?? 'dice';
  const count = normalizeCount(cfg.count ?? 1);
  const min = cfg.min ?? 1;
  const max = cfg.max ?? 100;
  const [values, setValues] = useState(() => rollValues(mode, count, min, max));
  const [rolling, setRolling] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollingRef = useRef(false);
  const palette = DICE_PALETTES.find(p => p.name === cfg.diceColor) ?? DICE_PALETTES[0];
  const numeric = mode === 'dice' || mode === 'd12' || mode === 'd20';
  const total = values.reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  const describe = (result: Array<number | string>) => result.map(v => COLOR_NAMES[String(v)] ?? String(v)).join(', ');

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    rollingRef.current = false;
    setRolling(false);
    setAnnouncement('');
    setValues(rollValues(mode, count, min, max));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [mode, count, min, max]);

  const roll = () => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setRolling(true);
    setAnnouncement('');
    if (cfg.sound) playDiceRoll();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = Date.now();
    const tick = () => {
      const result = rollValues(mode, count, min, max);
      setValues(result);
      const elapsed = Date.now() - start;
      if (reduced || elapsed >= 750) {
        rollingRef.current = false;
        setRolling(false);
        setAnnouncement(`Result: ${describe(result)}${numeric && cfg.showTotal && result.length > 1 ? `. Total ${result.reduce<number>((sum, v) => sum + Number(v), 0)}` : ''}`);
      } else timer.current = setTimeout(tick, 65 + elapsed / 8);
    };
    tick();
  };

  const n = numeric ? count : 1;
  const columns = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / columns);
  const faceSize = `min(calc((100cqw - 32px) / ${columns}), calc((100cqh - 68px) / ${rows}), 300px)`;
  return <div role="group" aria-label="Dice" className="dice-widget relative flex h-full w-full select-none flex-col items-center justify-center gap-2 p-3" style={{ containerType: 'size', '--die-fill': palette.fill, '--die-ink': palette.ink } as CSSProperties}>
    <div className="flex min-h-0 flex-1 items-center justify-center w-full">
      <div className="grid place-items-center gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {values.map((value, index) => <div key={index} role="img" aria-label={rolling ? 'Rolling' : `${mode === 'dice' ? 'Die' : 'Result'} ${index + 1}: ${COLOR_NAMES[String(value)] ?? value}`} className={rolling ? 'dice-tumbling' : ''} style={{ gridColumn: n === 3 && index === 2 ? 'span 2' : undefined, width: faceSize, height: faceSize, color: palette.ink, animationDelay: `${index * -70}ms` }}>
          {mode === 'dice' ? <DieFace value={Number(value)} soft className="w-full h-full" />
            : mode === 'd12' || mode === 'd20' ? <PolyDie value={Number(value)} sides={mode === 'd12' ? 12 : 20} className="w-full h-full" />
            : mode === 'color' ? <ColorFace color={String(value)} className="w-full h-full" />
            : mode === 'coin' ? <CoinFace side={String(value)} className="w-full h-full" />
            : mode === 'rps' ? <RpsFace value={String(value)} className="w-full h-full" />
            : <LetterFace value={String(value)} className="w-full h-full" />}
        </div>)}
      </div>
    </div>
    <div className="flex h-11 shrink-0 items-center justify-center gap-3">
      {numeric && cfg.showTotal && values.length > 1 && <span className="text-sm font-semibold tabular-nums">Total <strong className="text-xl">{rolling ? '—' : total}</strong></span>}
      <button type="button" onClick={roll} disabled={rolling} aria-label="Roll" title="Roll dice" className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[var(--w-accent,#6366f1)] px-4 font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        <Dices className="h-5 w-5" aria-hidden /><span className="text-sm">{rolling ? 'Rolling…' : 'Roll'}</span>
      </button>
    </div>
    <span role="status" className="sr-only">{announcement}</span>
    <style>{`@keyframes dice-tumble { 0%,100% {transform:rotate(-7deg) scale(.94)} 50% {transform:rotate(7deg) scale(1)} } .dice-tumbling {animation:dice-tumble 180ms ease-in-out infinite} @media(prefers-reduced-motion:reduce){.dice-tumbling{animation:none}}`}</style>
  </div>;
}
