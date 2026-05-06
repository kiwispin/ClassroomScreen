import { Clock } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import ClockSettings from './Settings';

export const clockMeta: WidgetMeta = {
  type: 'clock',
  label: 'Clock',
  Icon: Clock,
  defaultSize: { width: 280, height: 140 },
  defaultConfig: { format24: true, showSeconds: false, showDate: true },
  Settings: ClockSettings,
  iconColor: 'text-sky-500',
};
