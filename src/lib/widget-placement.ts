import type { WidgetInstance } from '../store/types';

/** Prefer free space near the usual starting point; avoid identical stacks on busy screens. */
export function nextWidgetPosition(widgets: WidgetInstance[], size: WidgetInstance['size'], bounds: { width: number; height: number }) {
  const maxX = Math.max(0, bounds.width - size.width - 12);
  const maxY = Math.max(0, bounds.height - size.height - 120);
  const start = { x: Math.min(80, maxX), y: Math.min(80, maxY) };
  const xs = new Set([start.x, Math.min(12, maxX), maxX]);
  const ys = new Set([start.y, Math.min(48, maxY), maxY]);
  for (let x = 16; x < maxX; x += 32) xs.add(x);
  for (let y = 48; y < maxY; y += 32) ys.add(y);
  let best = start;
  let bestScore = Infinity;
  for (const x of xs) for (const y of ys) {
    let overlap = 0;
    let stacked = false;
    for (const widget of widgets) {
      const p = widget.position, s = widget.size;
      overlap += Math.max(0, Math.min(x + size.width, p.x + s.width + 16) - Math.max(x, p.x - 16))
        * Math.max(0, Math.min(y + size.height, p.y + s.height + 16) - Math.max(y, p.y - 16));
      if (Math.abs(x - p.x) < 24 && Math.abs(y - p.y) < 24) stacked = true;
    }
    const score = (stacked ? 1e12 : 0) + overlap * 1e6 + (x - start.x) ** 2 + (y - start.y) ** 2;
    if (score < bestScore) { bestScore = score; best = { x, y }; }
  }
  return best;
}
