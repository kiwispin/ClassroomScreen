import { describe, it, expect } from 'vitest';
import { resizeImage } from './resize';

describe('resizeImage', () => {
  it('returns the original file when smaller than maxEdge', async () => {
    const tiny = new File(['x'], 'tiny.txt', { type: 'image/jpeg' });
    const close = () => {};
    (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap =
      (async () => ({ width: 100, height: 100, close })) as unknown as typeof createImageBitmap;
    const out = await resizeImage(tiny, 2000);
    expect(out).toBe(tiny);
  });
});
