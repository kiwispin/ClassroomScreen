import { MessageSquare } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';

export const workSymbolsMeta: WidgetMeta = {
  type: 'worksymbols',
  label: 'Work Symbols',
  Icon: MessageSquare,
  defaultSize: { width: 360, height: 220 },
  defaultConfig: { active: null },
  iconColor: 'text-violet-500',
};