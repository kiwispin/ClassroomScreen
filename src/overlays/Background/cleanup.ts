import { keys, createStore } from 'idb-keyval';
import { deleteImage } from './idb';
import type { AppState, ScreenState } from '../../store/types';

const imageStore = createStore('classroomscreen', 'images');

const collectFromScreen = (scr: ScreenState, ids: Set<string>): void => {
  if (scr.background.kind === 'image') ids.add(scr.background.imageId);
  for (const w of scr.widgets) {
    if (w.type === 'image') {
      const c = w.config as { source?: string; imageId?: string };
      if (c.source === 'upload' && typeof c.imageId === 'string') {
        ids.add(c.imageId);
      }
    }
  }
};

export const collectReferencedImageIds = (
  s: Pick<AppState, 'current' | 'presets'>,
): Set<string> => {
  const ids = new Set<string>();
  collectFromScreen(s.current, ids);
  for (const p of s.presets) collectFromScreen(p.state, ids);
  return ids;
};

export const pruneOrphanImages = async (
  s: Pick<AppState, 'current' | 'presets'>,
): Promise<number> => {
  const referenced = collectReferencedImageIds(s);
  const allKeys = (await keys(imageStore)) as string[];
  let removed = 0;
  for (const key of allKeys) {
    if (!referenced.has(key)) {
      await deleteImage(key);
      removed += 1;
    }
  }
  return removed;
};
