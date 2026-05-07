export type DiceMode =
  | 'dice'
  | 'range'
  | 'color'
  | 'd12'
  | 'd20'
  | 'coin'
  | 'letter'
  | 'rps';

export const COLORS = ['#c084fc', '#f87171', '#fbbf24', '#34d399', '#38bdf8', '#818cf8'];
export const COIN_SIDES = ['heads', 'tails'];
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const RPS = ['rock', 'paper', 'scissors'] as const;

export const rollDie = (rng: () => number = Math.random): number =>
  1 + Math.floor(rng() * 6);

export const rollSided = (sides: number, rng: () => number = Math.random): number =>
  1 + Math.floor(rng() * Math.max(1, sides));

export const rollDice = (count: number, rng: () => number = Math.random): number[] =>
  Array.from({ length: Math.max(1, Math.min(8, count)) }, () => rollDie(rng));

export const pickInRange = (
  min: number,
  max: number,
  rng: () => number = Math.random,
): number => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(rng() * (hi - lo + 1));
};

export const pickOne = <T,>(items: readonly T[], rng: () => number = Math.random): T =>
  items[Math.min(items.length - 1, Math.floor(rng() * items.length))];

export const DIE_GLYPHS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
