import { Hourglass } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';

export const stopwatchMeta: WidgetMeta = {
  type: 'stopwatch',
  label: 'Stopwatch',
  Icon: Hourglass,
  defaultSize: { width: 280, height: 180 },
  defaultConfig: { running: false, startedAt: null, accumulatedMs: 0 },
  iconColor: 'text-indigo-500',
};