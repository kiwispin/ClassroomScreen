import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  DEFAULT_SCREEN,
  SCHEMA_VERSION,
  WidgetType,
} from './types';
import { newId } from '../lib/uuid';
import { getWidgetMeta } from '../widgets/registry';

const FALLBACK_SIZE = { width: 240, height: 160 };

const getDefaultSize = (type: WidgetType): { width: number; height: number } =>
  getWidgetMeta(type)?.defaultSize ?? FALLBACK_SIZE;

const getDefaultConfig = (type: WidgetType): Record<string, unknown> =>
  getWidgetMeta(type)?.defaultConfig ?? {};

type Actions = {
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, width: number, height: number) => void;
  focusWidget: (id: string) => void;
  updateWidgetConfig: (id: string, patch: Record<string, unknown>) => void;
  setBackground: (bg: import('./types').Background) => void;
  toggleAnnotate: () => void;
  toggleToolbarPinned: () => void;
  savePresetAs: (name: string) => void;
  switchToPreset: (id: string) => void;
  updateActivePreset: () => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
};

const cloneScreen = <T,>(s: T): T => JSON.parse(JSON.stringify(s));

const initialState: AppState = {
  schemaVersion: SCHEMA_VERSION,
  current: DEFAULT_SCREEN,
  presets: [],
  activePresetId: null,
  annotateOpen: false,
  toolbarPinned: false,
};

const nextZIndex = (widgets: { zIndex: number }[]): number =>
  widgets.length === 0 ? 1 : Math.max(...widgets.map((w) => w.zIndex)) + 1;

export const useAppStore = create<AppState & Actions>()(
  persist(
    (set) => ({
      ...initialState,

      addWidget: (type) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: [
              ...s.current.widgets,
              {
                id: newId(),
                type,
                position: { x: 80, y: 80 },
                size: getDefaultSize(type),
                zIndex: nextZIndex(s.current.widgets),
                config: getDefaultConfig(type),
              },
            ],
          },
        })),

      removeWidget: (id) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.filter((w) => w.id !== id),
          },
        })),

      updateWidgetPosition: (id, x, y) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, position: { x, y } } : w,
            ),
          },
        })),

      updateWidgetSize: (id, width, height) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, size: { width, height } } : w,
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

      setBackground: (bg) =>
        set((s) => ({
          current: { ...s.current, background: bg },
        })),

      toggleAnnotate: () => set((s) => ({ annotateOpen: !s.annotateOpen })),

      toggleToolbarPinned: () => set((s) => ({ toolbarPinned: !s.toolbarPinned })),

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

      deletePreset: (id) =>
        set((s) => ({
          presets: s.presets.filter((p) => p.id !== id),
          activePresetId: s.activePresetId === id ? null : s.activePresetId,
        })),
    }),
    {
      name: 'classroomscreen-state',
      version: SCHEMA_VERSION,
    },
  ),
);
