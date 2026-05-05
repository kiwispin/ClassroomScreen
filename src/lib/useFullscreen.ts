import { useEffect, useState, useCallback } from 'react';

export function useFullscreen() {
  const [isFs, setIsFs] = useState<boolean>(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    } else {
      document.documentElement.requestFullscreen?.().catch(() => { /* ignore */ });
    }
  }, []);

  return { isFs, toggle };
}
