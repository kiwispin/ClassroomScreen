import type { WidgetType } from '../../store/types';

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
};

export const demoMeta: WidgetMeta = {
  type: 'demo',
  label: 'Demo',
  icon: '🧪',
  defaultSize: { width: 240, height: 160 },
  defaultConfig: {},
};
