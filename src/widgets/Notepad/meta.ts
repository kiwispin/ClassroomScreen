import { StickyNote } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import NotepadSettings from './Settings';

export const notepadMeta: WidgetMeta = {
  type: 'notepad',
  label: 'Notepad',
  Icon: StickyNote,
  defaultSize: { width: 480, height: 300 },
  defaultConfig: { text: '', fontSize: 28, autoFit: false, fontFamily: 'Rounded' },
  Settings: NotepadSettings,
  iconColor: 'text-amber-500',
};
