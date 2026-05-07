import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { getImage } from '../../overlays/Background/idb';

export type ImageEmbedConfig = {
  source?: 'url' | 'upload';
  url?: string;
  imageId?: string;
  fit?: 'cover' | 'contain';
};

export default function ImageEmbed({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as ImageEmbedConfig;
  const fit = cfg.fit ?? 'contain';
  const source = cfg.source ?? 'url';

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    setImgError(false);
    if (source === 'upload' && cfg.imageId) {
      getImage(cfg.imageId).then((blob) => {
        if (revoked || !blob) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      });
    } else {
      setBlobUrl(null);
    }
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, cfg.imageId]);

  const src = source === 'upload' ? blobUrl : (cfg.url ?? '').trim();

  if (!src || imgError) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center gap-2 p-3 text-center"
        style={{ containerType: 'size' as const }}
      >
        <ImageIcon
          className="opacity-30"
          style={{
            width: 'min(20cqi, 28cqb)',
            height: 'min(20cqi, 28cqb)',
          }}
          strokeWidth={1.25}
        />
        <div
          className="opacity-50"
          style={{ fontSize: 'min(5cqi, 7cqb)' }}
        >
          {imgError ? 'Image failed to load' : 'Set an image URL or upload one in ⚙'}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full"
      style={{ objectFit: fit }}
      onError={() => setImgError(true)}
    />
  );
}
