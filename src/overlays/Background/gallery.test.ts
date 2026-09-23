import { describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import type { AppState } from '../../store/types';
import { deleteSavedUpload, matchesLocalSearch, tagsFromFileName } from './gallery';
import { getImage, putImage } from './idb';

const screen: AppState['current'] = {
  widgets: [],
  background: { kind: 'solid', color: '#fff' },
};

describe('background gallery helpers', () => {
  it('searches names and tags without case sensitivity', () => {
    expect(matchesLocalSearch('AUTUMN', ['Autumn canopy', 'forest'])).toBe(true);
    expect(matchesLocalSearch('shore', ['Auckland waves', 'coast'])).toBe(false);
    expect(matchesLocalSearch('  ', ['anything'])).toBe(true);
  });

  it('derives local search tags from uploaded filenames', () => {
    expect(tagsFromFileName('Autumn_Forest 01.JPG')).toEqual(['autumn', 'forest', '01']);
  });

  it('retains stored uploads referenced by the current screen, a preset, or a widget', async () => {
    const currentId = await putImage(new Blob(['current']));
    const presetId = await putImage(new Blob(['preset']));
    const widgetId = await putImage(new Blob(['widget']));
    const state: Pick<AppState, 'current' | 'presets'> = {
      current: {
        ...screen,
        background: { kind: 'image', imageId: currentId, fit: 'cover' },
        widgets: [{
          id: 'image-widget', type: 'image', position: { x: 0, y: 0 },
          size: { width: 100, height: 100 }, zIndex: 1,
          config: { source: 'upload', imageId: widgetId },
        }],
      },
      presets: [{
        id: 'preset', name: 'Preset', createdAt: 0, updatedAt: 0,
        state: { ...screen, background: { kind: 'image', imageId: presetId, fit: 'contain' } },
      }],
    };
    const removeMetadata = vi.fn();

    for (const id of [currentId, presetId, widgetId]) {
      await expect(deleteSavedUpload(id, state, removeMetadata)).resolves.toBe(true);
      expect(await getImage(id)).toBeDefined();
    }
    expect(removeMetadata).toHaveBeenCalledTimes(3);
  });

  it('deletes an unreferenced upload from IndexedDB', async () => {
    const id = await putImage(new Blob(['unused']));
    const removeMetadata = vi.fn();
    await expect(deleteSavedUpload(id, { current: screen, presets: [] }, removeMetadata)).resolves.toBe(false);
    expect(removeMetadata).toHaveBeenCalledWith(id);
    expect(await getImage(id)).toBeUndefined();
  });

  it('keeps gallery metadata if deleting the stored image fails', async () => {
    const id = 'saved-image';
    const removeMetadata = vi.fn();
    const failure = new Error('storage unavailable');
    await expect(deleteSavedUpload(
      id,
      { current: screen, presets: [] },
      removeMetadata,
      () => Promise.reject(failure),
    )).rejects.toBe(failure);
    expect(removeMetadata).not.toHaveBeenCalled();
  });
});
