import { Volume2 } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import NoiseMeterSettings from './Settings';

export const noiseMeterMeta: WidgetMeta = {
  type: 'noisemeter',
  label: 'Noise',
  Icon: Volume2,
  defaultSize: { width: 240, height: 240 },
  defaultConfig: { threshold: 0.5 },
  Settings: NoiseMeterSettings,
  secondary: true,
  iconColor: 'text-cyan-500',
};