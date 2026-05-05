import { QrCode } from 'lucide-react';
import type { WidgetMeta } from '../Demo/meta';
import QRCodeSettings from './Settings';

export const qrCodeMeta: WidgetMeta = {
  type: 'qrcode',
  label: 'QR Code',
  Icon: QrCode,
  defaultSize: { width: 240, height: 280 },
  defaultConfig: { url: '', caption: '' },
  Settings: QRCodeSettings,
};
