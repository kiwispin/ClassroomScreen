import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
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
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm p-3 text-center">
        Set an image URL or upload one in ⚙.
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-full w-full bg-slate-100"
      style={{ objectFit: fit }}
    />
  );
}
