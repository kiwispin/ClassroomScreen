import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Timer from './Timer';
import Stopwatch from './Stopwatch';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN } from '../store/types';
import { playSfx } from '../lib/audio';
vi.mock('../lib/audio', () => ({ playSfx: vi.fn(), SFX_NAMES: ['bell'] }));
vi.mock('../lib/background-music', () => ({ stopBackgroundMusic: vi.fn() }));
function Harness({ type }: { type: 'timer' | 'stopwatch' }) {
  const instance = useAppStore(s => s.current.widgets[0]);
  return type === 'timer' ? <Timer instance={instance} /> : <Stopwatch instance={instance} />;
}
function setup(type: 'timer' | 'stopwatch', config: Record<string, unknown>) {
  useAppStore.setState({ current: { ...DEFAULT_SCREEN, widgets: [{ id: 'time', type, config, position: { x: 0, y: 0 }, size: { width: 500, height: 200 }, zIndex: 1 }] } });
  render(<Harness type={type} />);
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(100_000); vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const config = () => useAppStore.getState().current.widgets[0].config;
describe('Lesson timing controls', () => {
  it('pauses the timer at the click time and resumes without losing time', () => {
    setup('timer', { durationMs: 60_000, fullDurationMs: 60_000 });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.setSystemTime(100_125));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(config().durationMs).toBe(59_875);
    act(() => vi.setSystemTime(110_000));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(config().startedAt).toBe(110_000);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(config()).toMatchObject({ running: false, durationMs: 60_000 });
  });
  it('adjusts the displayed paused duration with labelled keyboard controls', () => {
    setup('timer', { durationMs: 30_000, fullDurationMs: 60_000 });
    const button = screen.getByRole('button', { name: 'Increase seconds' });
    expect(button.tabIndex).toBe(0);
    fireEvent.click(button);
    expect(config().durationMs).toBe(31_000);
  });
  it('plays the finish alert once and stops at zero', () => {
    setup('timer', { durationMs: 1000, fullDurationMs: 1000 });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(1250));
    expect(config()).toMatchObject({ running: false, durationMs: 0 });
    expect(playSfx).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(playSfx).toHaveBeenCalledTimes(1);
  });
  it('preserves stopwatch fractions over pauses and resets cleanly', () => {
    setup('stopwatch', { accumulatedMs: 3_600_000 });
    expect(within(screen.getByRole('group', { name: 'Stopwatch' })).getByText('01:00:00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.setSystemTime(100_075));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(config().accumulatedMs).toBe(3_600_075);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(config()).toMatchObject({ accumulatedMs: 0, running: false });
  });
});
