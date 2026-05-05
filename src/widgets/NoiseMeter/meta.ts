import type { WidgetMeta } from '../Demo/meta';
import NoiseMeterSettings from './Settings';

export const noiseMeterMeta: WidgetMeta = {
  type: 'noisemeter',
  label: 'Noise',
  icon: '🔊',
  defaultSize: { width: 240, height: 240 },
  defaultConfig: { threshold: 0.5 },
  Settings: NoiseMeterSettings,
};
