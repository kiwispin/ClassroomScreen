import type { WidgetInstance } from '../store/types';

export type LayoutChange = { id: string; before?: WidgetInstance; after?: WidgetInstance };
export type LayoutEdit = { label: string; changes: LayoutChange[] };
export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export const HISTORY_LIMIT = 50;

// Existing widgets retain live content, timer state, and settings when layout is undone.
export function applyLayoutEdit(widgets: WidgetInstance[], edit: LayoutEdit, undo: boolean) {
  let result = [...widgets];
  for (const change of edit.changes) {
    const target = undo ? change.before : change.after;
    if (!target) result = result.filter((w) => w.id !== change.id);
    else {
      const existing = result.find((w) => w.id === change.id);
      result = existing
        ? result.map((w) => w.id === change.id ? { ...w, position: { ...target.position }, size: { ...target.size }, locked: target.locked } : w)
        : [...result, JSON.parse(JSON.stringify(target)) as WidgetInstance];
    }
  }
  return result;
}

export function alignWidgets(widgets: WidgetInstance[], ids: string[], alignment: Alignment): LayoutChange[] {
  const selected = widgets.filter((w) => ids.includes(w.id) && !w.locked);
  if (selected.length < 2) return [];
  const left = Math.min(...selected.map((w) => w.position.x));
  const top = Math.min(...selected.map((w) => w.position.y));
  const right = Math.max(...selected.map((w) => w.position.x + w.size.width));
  const bottom = Math.max(...selected.map((w) => w.position.y + w.size.height));
  return selected.map((w) => {
    const position = { ...w.position };
    if (alignment === 'left') position.x = left;
    if (alignment === 'center') position.x = (left + right - w.size.width) / 2;
    if (alignment === 'right') position.x = right - w.size.width;
    if (alignment === 'top') position.y = top;
    if (alignment === 'middle') position.y = (top + bottom - w.size.height) / 2;
    if (alignment === 'bottom') position.y = bottom - w.size.height;
    return { id: w.id, before: w, after: { ...w, position } };
  }).filter((c) => c.before.position.x !== c.after.position.x || c.before.position.y !== c.after.position.y);
}
