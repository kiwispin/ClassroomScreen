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

// Scheduler — auto-load a preset at a given time of day on selected weekdays.
// daysOfWeek uses JS Date.getDay() values: 0 = Sunday … 6 = Saturday.
// startTime is "HH:MM" in 24-hour local time.
export type ScheduleRule = {
  id: string;
  presetId: string;
  daysOfWeek: number[];
  startTime: string;
};

export type AppState = {
  schemaVersion: number;
  current: ScreenState;
  presets: Preset[];
  activePresetId: string | null;
  annotateOpen: boolean;
  annotateTool: 'pen' | 'eraser';
  annotateColor: string;
  annotateWidth: number;
  annotateCanUndo: boolean;
  annotateUndoRequest: number;
  annotateClearRequest: number;
  toolbarPinned: boolean;
  toolbarHidden: boolean;
  schedule: ScheduleRule[];
  scheduleEnabled: boolean;
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
