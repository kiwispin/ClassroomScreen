export type DiceMode = 'dice' | 'range';

export const rollDie = (rng: () => number = Math.random): number =>
  1 + Math.floor(rng() * 6);

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

export const DIE_GLYPHS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
