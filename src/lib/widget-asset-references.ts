import { useAppStore } from '../store/store';
import type { WidgetInstance } from '../store/types';

// Shared uploads must survive edits to a duplicate and restoration from undo.
export function widgetAssetIsShared(id: string, kind: 'image' | 'audio', excludingWidgetId: string) {
  const state = useAppStore.getState();
  const widgets: WidgetInstance[] = [
    ...state.current.widgets.filter((w) => w.id !== excludingWidgetId),
    ...state.presets.flatMap((p) => p.state.widgets),
    ...[...state.layoutPast, ...state.layoutFuture].flatMap((edit) => edit.changes.flatMap((change) => [change.before, change.after].filter((w): w is WidgetInstance => Boolean(w)))),
  ];
  if (kind === 'audio') return state.backgroundMusicId === id || widgets.some((w) => w.config.customSoundId === id);
  const backgrounds = [state.current.background, ...state.presets.map((p) => p.state.background)];
  return state.backgroundUploads?.some((upload) => upload.id === id)
    || backgrounds.some((bg) => bg.kind === 'image' && bg.imageId === id)
    || widgets.some((w) => w.config.imageId === id || (Array.isArray(w.config.activities) && w.config.activities.some((item) => item?.imageId === id)));
}
