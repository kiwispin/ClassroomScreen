import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { WidgetInstance } from '../../store/types';

export type QRCodeConfig = { url?: string; caption?: string };

export default function QRCodeWidget({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as QRCodeConfig;
  const url = (cfg.url ?? '').trim();
  const caption = cfg.caption ?? '';

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center p-3 gap-2"
      style={{ containerType: 'size' as const }}
    >
      {url ? (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center w-full">
            {/* QR code stays black-on-white so phones scan reliably regardless of theme. */}
            <div className="h-full aspect-square max-h-full max-w-full bg-white rounded p-[2%]">
              <QRCodeSVG
                value={url}
                level="M"
                fgColor="#0f172a"
                bgColor="#ffffff"
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
          {caption && (
            <div
              className="text-center break-all opacity-80 leading-tight"
              style={{ fontSize: 'min(5cqi, 8cqb)' }}
            >
              {caption}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <QrCode
            className="opacity-30"
            style={{
              width: 'min(22cqi, 30cqb)',
              height: 'min(22cqi, 30cqb)',
            }}
            strokeWidth={1.25}
          />
          <div
            className="opacity-50"
            style={{ fontSize: 'min(5cqi, 7cqb)' }}
          >
            Set a URL in ⚙ settings.
          </div>
        </div>
      )}
    </div>
  );
}
