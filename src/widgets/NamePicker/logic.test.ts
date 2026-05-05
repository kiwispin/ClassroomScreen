import { describe, it, expect } from 'vitest';
import { parseNames, pickIndex } from './logic';

describe('parseNames', () => {
  it('splits on newlines and commas', () => {
    expect(parseNames('Alice\nBob, Carol\n  Dan  ')).toEqual(['Alice', 'Bob', 'Carol', 'Dan']);
  });
  it('drops empties', () => {
    expect(parseNames('\n\nAlice\n')).toEqual(['Alice']);
  });
});

describe('pickIndex', () => {
  it('returns -1 for empty pool', () => {
    expect(pickIndex(0)).toBe(-1);
  });
  it('uses the seeded rng deterministically', () => {
    const rng = () => 0.5;
    expect(pickIndex(10, rng)).toBe(5);
    expect(pickIndex(4, rng)).toBe(2);
  });
});
