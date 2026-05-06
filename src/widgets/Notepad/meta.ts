import { StickyNote } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import NotepadSettings from './Settings';

export const notepadMeta: WidgetMeta = {
  type: 'notepad',
  label: 'Notepad',
  Icon: StickyNote,
  defaultSize: { width: 360, height: 240 },
  defaultConfig: { text: '', fontSize: 16 },
  Settings: NotepadSettings,
  iconColor: 'text-amber-500',
};
