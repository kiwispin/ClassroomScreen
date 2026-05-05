import { keys, createStore } from 'idb-keyval';
import { deleteImage } from './idb';
import type { AppState } from '../../store/types';

const imageStore = createStore('classroomscreen', 'images');

export const collectReferencedImageIds = (
  s: Pick<AppState, 'current' | 'presets'>,
): Set<string> => {
  const ids = new Set<string>();
  if (s.current.background.kind === 'image') ids.add(s.current.background.imageId);
  for (const p of s.presets) {
    if (p.state.background.kind === 'image') ids.add(p.state.background.imageId);
  }
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
