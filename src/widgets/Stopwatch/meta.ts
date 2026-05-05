import type { WidgetMeta } from '../Demo/meta';

export const stopwatchMeta: WidgetMeta = {
  type: 'stopwatch',
  label: 'Stopwatch',
  icon: '⏲️',
  defaultSize: { width: 280, height: 180 },
  defaultConfig: { running: false, startedAt: null, accumulatedMs: 0 },
};
