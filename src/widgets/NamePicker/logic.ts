export const parseNames = (text: string): string[] =>
  text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export const pickIndex = (poolSize: number, rng: () => number = Math.random): number => {
  if (poolSize <= 0) return -1;
  return Math.floor(rng() * poolSize);
};
