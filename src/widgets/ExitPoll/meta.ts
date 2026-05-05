import type { WidgetMeta } from '../Demo/meta';

export const exitPollMeta: WidgetMeta = {
  type: 'poll',
  label: 'Poll',
  icon: '📊',
  defaultSize: { width: 360, height: 220 },
  defaultConfig: { up: 0, mid: 0, down: 0 },
};
