import type { WidgetMeta } from '../Demo/meta';
import ImageEmbedSettings from './Settings';

export const imageEmbedMeta: WidgetMeta = {
  type: 'image',
  label: 'Image',
  icon: '🖼️',
  defaultSize: { width: 320, height: 240 },
  defaultConfig: { source: 'url', url: '', fit: 'contain' },
  Settings: ImageEmbedSettings,
};
