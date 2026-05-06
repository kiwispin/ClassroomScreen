import { Vote } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';

export const exitPollMeta: WidgetMeta = {
  type: 'poll',
  label: 'Poll',
  Icon: Vote,
  defaultSize: { width: 360, height: 220 },
  defaultConfig: { up: 0, mid: 0, down: 0 },
  secondary: true,
  iconColor: 'text-purple-500',
};