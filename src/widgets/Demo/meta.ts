import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../../store/types';

export type WidgetSettingsProps = { instance: WidgetInstance };

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
  Settings?: ComponentType<WidgetSettingsProps>;
};

export const demoMeta: WidgetMeta = {
  type: 'demo',
  label: 'Demo',
  icon: '🧪',
  defaultSize: { width: 240, height: 160 },
  defaultConfig: {},
};
