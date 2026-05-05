import { useEffect, useState } from 'react';
import type { Background } from '../../store/types';
import { getImage } from './idb';

export default function BackgroundLayer({ bg }: { bg: Background }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    if (bg.kind === 'image') {
      getImage(bg.imageId).then((blob) => {
        if (revoked || !blob) return;
        url = URL.createObjectURL(blob);
        setImgUrl(url);
      });
    } else {
      setImgUrl(null);
    }
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [bg]);

  if (bg.kind === 'solid') {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
  }
  if (bg.kind === 'gradient') {
    return <div className="absolute inset-0" style={{ backgroundImage: bg.css }} />;
  }
  return (
    <div
      className="absolute inset-0 bg-slate-200"
      style={{
        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
        backgroundSize: bg.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
