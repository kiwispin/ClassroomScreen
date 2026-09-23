import { useEffect, useState } from 'react';
import type { Background } from '../../store/types';
import { getCuratedBackground } from './catalog';
import { getImage } from './idb';

type LoadedImage = { key: string; src: string | null; failed: boolean };

export default function BackgroundLayer({ bg }: { bg: Background }) {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const sourceKey = bg.kind === 'image'
    ? `upload:${bg.imageId}`
    : bg.kind === 'preset-image'
      ? `preset:${bg.assetId}`
      : null;

  useEffect(() => {
    if (!sourceKey) {
      setLoaded(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoaded({ key: sourceKey, src: null, failed: false });

    if (bg.kind === 'preset-image') {
      const photo = getCuratedBackground(bg.assetId);
      setLoaded({ key: sourceKey, src: photo?.image ?? null, failed: !photo });
    } else if (bg.kind === 'image') {
      void getImage(bg.imageId).then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setLoaded({ key: sourceKey, src: null, failed: true });
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ key: sourceKey, src: objectUrl, failed: false });
      }).catch(() => {
        if (!cancelled) setLoaded({ key: sourceKey, src: null, failed: true });
      });
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceKey]);

  if (bg.kind === 'solid') {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
  }
  if (bg.kind === 'gradient') {
    return <div className="absolute inset-0" style={{ backgroundImage: bg.css }} />;
  }

  const src = loaded?.key === sourceKey && !loaded.failed ? loaded.src : null;
  const fit = bg.fit;
  return (
    <div className="absolute inset-0 bg-slate-200" aria-label={src ? undefined : 'Background image unavailable'}>
      {src && (
        <img
          key={sourceKey}
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: fit }}
          onError={() => setLoaded({ key: sourceKey!, src: null, failed: true })}
        />
      )}
    </div>
  );
}
