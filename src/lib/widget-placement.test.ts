import { describe, it, expect } from 'vitest';
import { nextWidgetPosition } from './widget-placement';
import type { WidgetInstance } from '../store/types';
const size = { width: 320, height: 200 };
const widget = (x: number, y: number): WidgetInstance => ({ id: `${x}-${y}`, type: 'stopwatch', position: { x, y }, size, config: {}, zIndex: 1 });
describe('New widget placement', () => {
  it('keeps the first position and finds free space for another widget', () => {
    const bounds = { width: 1280, height: 800 };
    expect(nextWidgetPosition([], size, bounds)).toEqual({ x: 80, y: 80 });
    const p = nextWidgetPosition([widget(80, 80)], size, bounds);
    expect(p.x >= 416 || p.y >= 296).toBe(true);
    expect(p.x + size.width).toBeLessThanOrEqual(bounds.width);
    expect(p.y + size.height).toBeLessThanOrEqual(bounds.height - 120);
  });
  it('offsets on a crowded small screen instead of stacking exactly', () => {
    const bounds = { width: 390, height: 500 };
    const first = nextWidgetPosition([], size, bounds);
    const second = nextWidgetPosition([widget(first.x, first.y)], size, bounds);
    expect(second).not.toEqual(first);
    expect(second.x).toBeGreaterThanOrEqual(0);
    expect(second.x + size.width).toBeLessThanOrEqual(bounds.width);
    expect(second.y + size.height).toBeLessThanOrEqual(bounds.height - 120);
  });
});
