import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TestTube } from 'lucide-react';
import type { WidgetInstance, WidgetType } from '../../store/types';

export type WidgetSettingsProps = { instance: WidgetInstance };

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  Icon: LucideIcon;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
  Settings?: ComponentType<WidgetSettingsProps>;
  hidden?: boolean;
  secondary?: boolean; // when true, lives in the toolbar's "More" overflow
  // Tailwind text-color class for the toolbar icon when inactive
  // (e.g., "text-sky-500"). Falls back to slate.
  iconColor?: string;
};

export const demoMeta: WidgetMeta = {
  type: 'demo',
  label: 'Demo',
  Icon: TestTube,
  defaultSize: { width: 240, height: 160 },
  defaultConfig: {},
  hidden: true,
};
