import { Calendar } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import CalendarSettings from './Settings';

export const calendarMeta: WidgetMeta = {
  type: 'calendar',
  label: 'Calendar',
  Icon: Calendar,
  defaultSize: { width: 280, height: 160 },
  defaultConfig: { showMonthGrid: false },
  Settings: CalendarSettings,
  iconColor: 'text-pink-500',
};