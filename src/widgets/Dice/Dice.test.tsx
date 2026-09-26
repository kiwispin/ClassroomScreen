import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dice from './index';
import type { WidgetInstance } from '../../store/types';
import { playDiceRoll } from '../../lib/audio';
import { normalizeCount, normalizeBound, rollValues } from './logic';
vi.mock('../../lib/audio', () => ({ playDiceRoll: vi.fn() }));
const instance = (config: Record<string, unknown>): WidgetInstance => ({ id: 'dice-test', type: 'dice', config, position: { x: 0, y: 0 }, size: { width: 320, height: 200 }, zIndex: 1 });
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0); vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Dice experience', () => {
  it('rolls a set, displays the total and announces only the settled result', () => {
    render(<Dice instance={instance({ count: 3, showTotal: true, sound: true })} />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Roll' }));
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('status')).toHaveTextContent('Result: 1, 1, 1. Total 3');
    expect(playDiceRoll).toHaveBeenCalledTimes(1);
  });
  it('cancels an old roll when the dice type changes', () => {
    const { rerender } = render(<Dice instance={instance({ count: 8 })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll' }));
    rerender(<Dice instance={instance({ mode: 'operators' })} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAccessibleName('Result 1: +');
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
    expect(playDiceRoll).not.toHaveBeenCalled();
  });
  it('settles immediately when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<Dice instance={instance({ mode: 'coin' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll' }));
    expect(screen.getByRole('status')).toHaveTextContent('Result: heads');
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled();
  });
  it('supports polyhedral sets and sanitizes invalid saved values', () => {
    expect(rollValues('d20', 3, 1, 100)).toEqual([1, 1, 1]);
    expect(normalizeCount(NaN)).toBe(1);
    expect(normalizeCount(2.8)).toBe(2);
    expect(normalizeCount(900)).toBe(8);
    expect(normalizeBound(Infinity, 100)).toBe(100);
    expect(rollValues('range', 1, 5.5, -2.8)).toEqual([-2]);
  });
});
