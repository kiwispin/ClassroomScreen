import { CalendarDays } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import TimetableSettings from './Settings';
import {
  DEFAULT_START_TIME,
  type TimetableMode,
  type TimetableTimeFormat,
} from './logic';

export type { TimetableConfig, TimetableItem, TimetableMode, TimetableTimeFormat } from './logic';

export const timetableMeta: WidgetMeta = {
  type: 'timetable',
  label: 'Timetable',
  Icon: CalendarDays,
  defaultSize: { width: 440, height: 420 },
  defaultConfig: {
    mode: 'timed' satisfies TimetableMode,
    title: "What's going on today",
    showTitle: true,
    startTime: DEFAULT_START_TIME,
    timeFormat: '12' satisfies TimetableTimeFormat,
    alarm: 'bell',
    activities: [],
  },
  Settings: TimetableSettings,
  iconColor: 'text-emerald-500',
  secondary: true,
};
