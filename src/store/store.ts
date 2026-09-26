import { nextWidgetPosition } from '../lib/widget-placement';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  DEFAULT_SCREEN,
  SavedBackgroundUpload,
  SCHEMA_VERSION,
  WidgetType,
  ScheduleRule,
} from './types';
import { alignWidgets, applyLayoutEdit, HISTORY_LIMIT, type Alignment, type LayoutEdit } from '../lib/layout-history';
import type { WidgetInstance } from './types';
import { newId } from '../lib/uuid';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import { allWidgets, getWidgetMeta } from '../widgets/registry';

const FALLBACK_SIZE = { width: 240, height: 160 };

const getDefaultSize = (type: WidgetType): { width: number; height: number } =>
  getWidgetMeta(type)?.defaultSize ?? FALLBACK_SIZE;

const getDefaultConfig = (type: WidgetType): Record<string, unknown> =>
  getWidgetMeta(type)?.defaultConfig ?? {};

type LayoutRuntime = {
  layoutPast: LayoutEdit[];
  layoutFuture: LayoutEdit[];
  selectedWidgetIds: string[];
};

type Actions = {
  setToolbarWidgets: (types: WidgetType[]) => void;
  commitWidgetLayout: (id: string, position: WidgetInstance['position'], size?: WidgetInstance['size']) => void;
  toggleWidgetLock: (id: string) => void;
  duplicateWidget: (id: string, bounds?: { width: number; height: number }) => void;
  selectWidget: (id: string, additive?: boolean) => void;
  clearWidgetSelection: () => void;
  alignSelectedWidgets: (alignment: Alignment) => void;
  toggleSnapToGrid: () => void;
  undoLayout: () => void;
  redoLayout: () => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, width: number, height: number) => void;
  focusWidget: (id: string) => void;
  updateWidgetConfig: (id: string, patch: Record<string, unknown>) => void;
  setBackgroundMusic: (id: string, name: string) => void;
  setBackgroundMusicVolume: (volume: number) => void;
  clearBackgroundMusic: () => void;
  setBackground: (bg: import('./types').Background) => void;
  addBackgroundUpload: (upload: SavedBackgroundUpload) => void;
  removeBackgroundUpload: (id: string) => void;
  toggleAnnotate: () => void;
  setAnnotateTool: (tool: 'pen' | 'eraser') => void;
  setAnnotateColor: (color: string) => void;
  setAnnotateWidth: (width: number) => void;
  setAnnotateCanUndo: (canUndo: boolean) => void;
  requestAnnotateUndo: () => void;
  requestAnnotateClear: () => void;
  toggleToolbarPinned: () => void;
  toggleToolbarHidden: () => void;
  hideToolbar: () => void;
  showToolbar: () => void;
  savePresetAs: (name: string) => void;
  switchToPreset: (id: string) => void;
  updateActivePreset: () => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
  duplicatePreset: (id: string) => void;
  movePreset: (id: string, direction: -1 | 1) => void;
  addScheduleRule: (rule: Omit<ScheduleRule, 'id'>) => void;
  updateScheduleRule: (id: string, patch: Partial<Omit<ScheduleRule, 'id'>>) => void;
  deleteScheduleRule: (id: string) => void;
  toggleScheduleEnabled: () => void;
};

const cloneScreen = <T,>(s: T): T => JSON.parse(JSON.stringify(s));

const initialState: AppState = {
  schemaVersion: SCHEMA_VERSION,
  current: DEFAULT_SCREEN,
  presets: [],
  backgroundUploads: [],
  backgroundMusicId: undefined,
  backgroundMusicName: undefined,
  backgroundMusicVolume: 0.55,
  activePresetId: null,
  annotateOpen: false,
  annotateTool: 'pen',
  annotateColor: '#111827',
  annotateWidth: 5,
  annotateCanUndo: false,
  annotateUndoRequest: 0,
  annotateClearRequest: 0,
  toolbarPinned: false,
  toolbarHidden: false,
  schedule: [],
  scheduleEnabled: false,
};

const nextZIndex = (widgets: { zIndex: number }[]): number =>
  widgets.length === 0 ? 1 : Math.max(...widgets.map((w) => w.zIndex)) + 1;

function recordLayout(s: AppState & LayoutRuntime, edit: LayoutEdit) {
  // History stores snapshots so later content edits cannot mutate deleted copies.
  const snapshot = cloneScreen(edit);
  return {
    current: { ...s.current, widgets: applyLayoutEdit(s.current.widgets, snapshot, false) },
    layoutPast: [...s.layoutPast, snapshot].slice(-HISTORY_LIMIT), layoutFuture: [],
  };
}

export const useAppStore = create<AppState & Actions & LayoutRuntime>()(
  persist(
    (set) => ({
      ...initialState,
      setToolbarWidgets: (types) => set({ toolbarWidgets: resolveToolbarWidgets(types, allWidgets).map((w) => w.type) }),
      layoutPast: [], layoutFuture: [], selectedWidgetIds: [],

      selectWidget: (id, additive = false) => set((s) => ({ selectedWidgetIds: additive
        ? s.selectedWidgetIds.includes(id) ? s.selectedWidgetIds.filter((item) => item !== id) : [...s.selectedWidgetIds, id]
        : [id] })),
      clearWidgetSelection: () => set({ selectedWidgetIds: [] }),
      toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      commitWidgetLayout: (id, position, size) => set((s) => {
        const before = s.current.widgets.find((w) => w.id === id);
        if (!before || before.locked) return {};
        const after = { ...before, position, size: size ?? before.size };
        if (before.position.x === after.position.x && before.position.y === after.position.y && before.size.width === after.size.width && before.size.height === after.size.height) return {};
        return recordLayout(s, { label: size ? 'Resize widget' : 'Move widget', changes: [{ id, before, after }] });
      }),
      toggleWidgetLock: (id) => set((s) => {
        const before = s.current.widgets.find((w) => w.id === id);
        if (!before) return {};
        return recordLayout(s, { label: before.locked ? 'Unlock widget' : 'Lock widget', changes: [{ id, before, after: { ...before, locked: !before.locked } }] });
      }),
      duplicateWidget: (id, bounds) => set((s) => {
        const original = s.current.widgets.find((w) => w.id === id);
        if (!original) return {};
        const copy = cloneScreen(original);
        copy.id = newId(); copy.locked = false; copy.zIndex = nextZIndex(s.current.widgets);
        copy.position = {
          x: Math.max(0, Math.min(original.position.x + 24, (bounds?.width ?? Infinity) - copy.size.width)),
          y: Math.max(40, Math.min(original.position.y + 24, (bounds?.height ?? Infinity) - copy.size.height)),
        };
        // Copy settings without starting a second countdown or stopwatch.
        if (copy.type === 'timer') copy.config = { ...copy.config, running: false, startedAt: null, durationMs: copy.config.fullDurationMs ?? 300000 };
        if (copy.type === 'stopwatch') copy.config = { ...copy.config, running: false, startedAt: null, accumulatedMs: 0 };
        return { ...recordLayout(s, { label: 'Duplicate widget', changes: [{ id: copy.id, after: copy }] }), selectedWidgetIds: [copy.id] };
      }),
      alignSelectedWidgets: (alignment) => set((s) => {
        const changes = alignWidgets(s.current.widgets, s.selectedWidgetIds, alignment);
        return changes.length ? recordLayout(s, { label: 'Align widgets', changes }) : {};
      }),
      undoLayout: () => set((s) => {
        const edit = s.layoutPast[s.layoutPast.length - 1];
        if (!edit) return {};
        const redoEdit = { ...edit, changes: edit.changes.map((change) => !change.before && change.after ? { ...change, after: cloneScreen(s.current.widgets.find((w) => w.id === change.id) ?? change.after) } : change) };
        return { current: { ...s.current, widgets: applyLayoutEdit(s.current.widgets, edit, true) }, layoutPast: s.layoutPast.slice(0, -1), layoutFuture: [...s.layoutFuture, redoEdit], selectedWidgetIds: [] };
      }),
      redoLayout: () => set((s) => {
        const edit = s.layoutFuture[s.layoutFuture.length - 1];
        if (!edit) return {};
        return { current: { ...s.current, widgets: applyLayoutEdit(s.current.widgets, edit, false) }, layoutFuture: s.layoutFuture.slice(0, -1), layoutPast: [...s.layoutPast, edit], selectedWidgetIds: [] };
      }),

      addWidget: (type) => set((s) => {
        const size = getDefaultSize(type);
        const position = nextWidgetPosition(s.current.widgets, size, { width: typeof window === 'undefined' ? 1280 : window.innerWidth, height: typeof window === 'undefined' ? 720 : window.innerHeight });
        const widget: WidgetInstance = {
          id: newId(), type, position, size,
          zIndex: nextZIndex(s.current.widgets), config: cloneScreen(getDefaultConfig(type)),
        };
        return recordLayout(s, { label: 'Add widget', changes: [{ id: widget.id, after: widget }] });
      }),

      removeWidget: (id) => set((s) => {
        const before = s.current.widgets.find((w) => w.id === id);
        if (!before || before.locked) return {};
        return { ...recordLayout(s, { label: 'Delete widget', changes: [{ id, before }] }), selectedWidgetIds: s.selectedWidgetIds.filter((item) => item !== id) };
      }),

      updateWidgetPosition: (id, x, y) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id && !w.locked ? { ...w, position: { x, y } } : w,
            ),
          },
        })),

      updateWidgetSize: (id, width, height) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id && !w.locked ? { ...w, size: { width, height } } : w,
            ),
          },
        })),

      focusWidget: (id) =>
        set((s) => {
          const top = nextZIndex(s.current.widgets);
          return {
            current: {
              ...s.current,
              widgets: s.current.widgets.map((w) =>
                w.id === id ? { ...w, zIndex: top } : w,
              ),
            },
          };
        }),

      updateWidgetConfig: (id, patch) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, config: { ...w.config, ...patch } } : w,
            ),
          },
        })),

      setBackgroundMusic: (id, name) =>
        set({ backgroundMusicId: id, backgroundMusicName: name }),

      setBackgroundMusicVolume: (volume) =>
        set({ backgroundMusicVolume: Math.max(0, Math.min(1, volume)) }),

      clearBackgroundMusic: () =>
        set({ backgroundMusicId: undefined, backgroundMusicName: undefined }),

      setBackground: (bg) =>
        set((s) => ({
          current: { ...s.current, background: bg },
        })),

      addBackgroundUpload: (upload) =>
        set((s) => ({
          backgroundUploads: [
            ...(s.backgroundUploads ?? []).filter((item) => item.id !== upload.id),
            upload,
          ],
        })),

      removeBackgroundUpload: (id) =>
        set((s) => ({
          backgroundUploads: (s.backgroundUploads ?? []).filter((item) => item.id !== id),
        })),

      toggleAnnotate: () => set((s) => ({ annotateOpen: !s.annotateOpen })),

      setAnnotateTool: (tool) => set({ annotateTool: tool }),

      setAnnotateColor: (color) => set({ annotateColor: color, annotateTool: 'pen' }),

      setAnnotateWidth: (width) => set({ annotateWidth: width }),

      setAnnotateCanUndo: (canUndo) => set({ annotateCanUndo: canUndo }),

      requestAnnotateUndo: () =>
        set((s) => ({ annotateUndoRequest: s.annotateUndoRequest + 1 })),

      requestAnnotateClear: () =>
        set((s) => ({ annotateClearRequest: s.annotateClearRequest + 1 })),

      toggleToolbarPinned: () => set((s) => ({ toolbarPinned: !s.toolbarPinned })),

      toggleToolbarHidden: () => set((s) => ({ toolbarHidden: !s.toolbarHidden })),

      hideToolbar: () => set({ toolbarHidden: true }),

      showToolbar: () => set({ toolbarHidden: false }),

      savePresetAs: (name) =>
        set((s) => {
          const id = newId();
          const now = Date.now();
          return {
            presets: [
              ...s.presets,
              {
                id,
                name,
                state: cloneScreen(s.current),
                createdAt: now,
                updatedAt: now,
              },
            ],
            activePresetId: id,
          };
        }),

      switchToPreset: (id) =>
        set((s) => {
          const p = s.presets.find((p) => p.id === id);
          if (!p) return {};
          return {
            layoutPast: [], layoutFuture: [], selectedWidgetIds: [],
            current: cloneScreen(p.state),
            activePresetId: id,
          };
        }),

      updateActivePreset: () =>
        set((s) => {
          if (!s.activePresetId) return {};
          const now = Date.now();
          return {
            presets: s.presets.map((p) =>
              p.id === s.activePresetId
                ? { ...p, state: cloneScreen(s.current), updatedAt: now }
                : p,
            ),
          };
        }),

      renamePreset: (id, name) =>
        set((s) => ({
          presets: s.presets.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
          ),
        })),

      duplicatePreset: (id) => set((s) => {
        const index = s.presets.findIndex((p) => p.id === id);
        if (index < 0) return {};
        const original = s.presets[index];
        const names = new Set(s.presets.map((p) => p.name));
        let name = `${original.name} (copy)`;
        for (let n = 2; names.has(name); n++) name = `${original.name} (copy ${n})`;
        const now = Date.now();
        const copy = { ...original, id: newId(), name, state: cloneScreen(original.state), createdAt: now, updatedAt: now };
        const presets = [...s.presets];
        presets.splice(index + 1, 0, copy);
        return { presets };
      }),

      movePreset: (id, direction) => set((s) => {
        const index = s.presets.findIndex((p) => p.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= s.presets.length) return {};
        const presets = [...s.presets];
        [presets[index], presets[target]] = [presets[target], presets[index]];
        return { presets };
      }),

      deletePreset: (id) =>
        set((s) => ({
          presets: s.presets.filter((p) => p.id !== id),
          schedule: s.schedule.filter((rule) => rule.presetId !== id),
          activePresetId: s.activePresetId === id ? null : s.activePresetId,
        })),

      addScheduleRule: (rule) =>
        set((s) => ({
          schedule: [...s.schedule, { ...rule, id: newId() }],
        })),

      updateScheduleRule: (id, patch) =>
        set((s) => ({
          schedule: s.schedule.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteScheduleRule: (id) =>
        set((s) => ({
          schedule: s.schedule.filter((r) => r.id !== id),
        })),

      toggleScheduleEnabled: () =>
        set((s) => ({ scheduleEnabled: !s.scheduleEnabled })),
    }),
    {
      name: 'classroomscreen-state',
      partialize: ({ layoutPast: _past, layoutFuture: _future, selectedWidgetIds: _selected, ...state }) => state,
      version: SCHEMA_VERSION,
    },
  ),
);
