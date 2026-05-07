import { Calendar } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import CalendarSettings from './Settings';

export const calendarMeta: WidgetMeta = {
  type: 'calendar',
  label: 'Calendar',
  Icon: Calendar,
  defaultSize: { width: 640, height: 460 },
  defaultConfig: { showMonthGrid: true },
  Settings: CalendarSettings,
  iconColor: 'text-pink-500',
  secondary: true,
};
