import type { WidgetMeta } from '../Demo/meta';
import NamePickerSettings from './Settings';

export const namePickerMeta: WidgetMeta = {
  type: 'namepicker',
  label: 'Name Picker',
  icon: '🎲',
  defaultSize: { width: 320, height: 200 },
  defaultConfig: { namesText: '', removePicked: false, picked: [] },
  Settings: NamePickerSettings,
};
