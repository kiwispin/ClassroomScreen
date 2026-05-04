export type WidgetType =
  | 'demo'
  | 'clock'
  | 'timer'
  | 'stopwatch'
  | 'namepicker'
  | 'dice'
  | 'trafficlight'
  | 'worksymbols'
  | 'qrcode'
  | 'notepad'
  | 'image'
  | 'video'
  | 'poll'
  | 'calendar'
  | 'noisemeter';

export type WidgetInstance = {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  config: Record<string, unknown>;
};

export type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; css: string }
  | { kind: 'image'; imageId: string; fit: 'cover' | 'contain' };

export type ScreenState = {
  widgets: WidgetInstance[];
  background: Background;
};

export type Preset = {
  id: string;
  name: string;
  state: ScreenState;
  createdAt: number;
  updatedAt: number;
};

export type AppState = {
  schemaVersion: number;
  current: ScreenState;
  presets: Preset[];
  activePresetId: string | null;
  annotateOpen: boolean;
  toolbarPinned: boolean;
};

export const DEFAULT_BACKGROUND: Background = {
  kind: 'solid',
  color: '#dbeafe',
};

export const DEFAULT_SCREEN: ScreenState = {
  widgets: [],
  background: DEFAULT_BACKGROUND,
};

export const SCHEMA_VERSION = 1;
