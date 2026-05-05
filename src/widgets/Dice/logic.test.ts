import { describe, it, expect } from 'vitest';
import { rollDie, rollDice, pickInRange } from './logic';

describe('rollDie', () => {
  it('always returns 1..6', () => {
    for (let r = 0; r < 1; r += 0.001) {
      const v = rollDie(() => r);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollDice', () => {
  it('returns the requested count', () => {
    expect(rollDice(3, () => 0)).toHaveLength(3);
  });
  it('clamps count to 1..8', () => {
    expect(rollDice(0)).toHaveLength(1);
    expect(rollDice(99)).toHaveLength(8);
  });
});

describe('pickInRange', () => {
  it('inclusive of bounds', () => {
    expect(pickInRange(1, 10, () => 0)).toBe(1);
    expect(pickInRange(1, 10, () => 0.999999)).toBe(10);
  });
  it('handles reversed bounds', () => {
    expect(pickInRange(10, 1, () => 0)).toBe(1);
  });
});
