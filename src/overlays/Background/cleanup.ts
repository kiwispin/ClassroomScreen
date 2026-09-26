import { keys, createStore } from 'idb-keyval';
import { deleteImage } from './idb';
import type { LayoutEdit } from '../../lib/layout-history';
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
    if (w.type === 'timetable') {
      const c = w.config as { activities?: unknown };
      const activities = Array.isArray(c.activities) ? c.activities : [];
      for (const activity of activities) {
        if (!activity || typeof activity !== 'object') continue;
        const imageId = (activity as { imageId?: unknown }).imageId;
        if (typeof imageId === 'string' && imageId) ids.add(imageId);
      }
    }
  }
};

export const collectReferencedImageIds = (
  s: Pick<AppState, 'current' | 'presets'> & { layoutPast?: LayoutEdit[]; layoutFuture?: LayoutEdit[] },
): Set<string> => {
  const ids = new Set<string>();
  collectFromScreen(s.current, ids);
  for (const p of s.presets) collectFromScreen(p.state, ids);
  for (const edit of [...(s.layoutPast ?? []), ...(s.layoutFuture ?? [])]) {
    for (const change of edit.changes) {
      for (const widget of [change.before, change.after]) {
        if (widget) collectFromScreen({ background: { kind: 'solid', color: '#ffffff' }, widgets: [widget] }, ids);
      }
    }
  }
  return ids;
};

export const pruneOrphanImages = async (
  s: Pick<AppState, 'current' | 'presets'> & Partial<Pick<AppState, 'backgroundUploads'>>,
): Promise<number> => {
  const referenced = collectReferencedImageIds(s);
  for (const upload of s.backgroundUploads ?? []) referenced.add(upload.id);
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
