import { QRCodeSVG } from 'qrcode.react';
import type { WidgetInstance } from '../../store/types';

export type QRCodeConfig = { url?: string; caption?: string };

export default function QRCodeWidget({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as QRCodeConfig;
  const url = (cfg.url ?? '').trim();
  const caption = cfg.caption ?? '';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-3 gap-2">
      {url ? (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <QRCodeSVG
              value={url}
              level="M"
              style={{ height: '100%', width: 'auto', maxWidth: '100%' }}
            />
          </div>
          {caption && <div className="text-sm text-slate-600 text-center break-all">{caption}</div>}
        </>
      ) : (
        <div className="text-slate-400 text-sm text-center">
          Set a URL in ⚙ settings.
        </div>
      )}
    </div>
  );
}
