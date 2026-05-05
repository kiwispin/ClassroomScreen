import type { WidgetMeta } from '../Demo/meta';
import DiceSettings from './Settings';

export const diceMeta: WidgetMeta = {
  type: 'dice',
  label: 'Dice',
  icon: '🎯',
  defaultSize: { width: 320, height: 200 },
  defaultConfig: { mode: 'dice', count: 2, min: 1, max: 100 },
  Settings: DiceSettings,
};
