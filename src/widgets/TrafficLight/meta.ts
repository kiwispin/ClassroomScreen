import { Lightbulb } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';

export const trafficLightMeta: WidgetMeta = {
  type: 'trafficlight',
  label: 'Traffic Light',
  Icon: Lightbulb,
  defaultSize: { width: 160, height: 360 },
  defaultConfig: { active: 'red' },
};
