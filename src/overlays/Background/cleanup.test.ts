import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { putImage } from './idb';
import { collectReferencedImageIds, pruneOrphanImages } from './cleanup';
import type { AppState } from '../../store/types';

const baseState = (): Pick<AppState, 'current' | 'presets'> => ({
  current: {
    widgets: [],
    background: { kind: 'solid', color: '#fff' },
  },
  presets: [],
});

describe('collectReferencedImageIds', () => {
  it('collects ids from current and presets', () => {
    const s = baseState();
    s.current.background = { kind: 'image', imageId: 'a', fit: 'cover' };
    s.presets.push({
      id: 'p1', name: 'p', createdAt: 0, updatedAt: 0,
      state: { widgets: [], background: { kind: 'image', imageId: 'b', fit: 'cover' } },
    });
    const ids = collectReferencedImageIds(s);
    expect(ids).toEqual(new Set(['a', 'b']));
  });

  it('counts image-widget upload references too', () => {
    const s = baseState();
    s.current.widgets = [
      {
        id: 'w1',
        type: 'image',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        zIndex: 1,
        config: { source: 'upload', imageId: 'img-1' },
      },
    ];
    const ids = collectReferencedImageIds(s);
    expect(ids).toEqual(new Set(['img-1']));
  });
});

describe('pruneOrphanImages', () => {
  it('removes IDB entries that are not referenced', async () => {
    const used = await putImage(new Blob(['used']));
    const orphan = await putImage(new Blob(['orphan']));

    const s = baseState();
    s.current.background = { kind: 'image', imageId: used, fit: 'cover' };

    const removed = await pruneOrphanImages(s);
    expect(removed).toBe(1);
    const { getImage } = await import('./idb');
    expect(await getImage(orphan)).toBeUndefined();
    expect(await getImage(used)).toBeDefined();
  });
});
