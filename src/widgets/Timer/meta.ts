import { Timer } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import TimerSettings from './Settings';

export const timerMeta: WidgetMeta = {
  type: 'timer',
  label: 'Timer',
  Icon: Timer,
  defaultSize: { width: 480, height: 200 },
  defaultConfig: {
    durationMs: 5 * 60_000,
    fullDurationMs: 5 * 60_000,
    running: false,
    startedAt: null,
    sfx: 'bell',
    autoReset: false,
  },
  Settings: TimerSettings,
};
