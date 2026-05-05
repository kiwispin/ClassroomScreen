import type { WidgetMeta } from '../Demo/meta';
import VideoEmbedSettings from './Settings';

export const videoEmbedMeta: WidgetMeta = {
  type: 'video',
  label: 'Video',
  icon: '📺',
  defaultSize: { width: 480, height: 280 },
  defaultConfig: { url: '' },
  Settings: VideoEmbedSettings,
};
