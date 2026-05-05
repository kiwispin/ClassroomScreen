export const parseYouTubeId = (raw: string): string | null => {
  const url = raw.trim();
  if (!url) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.replace(/^\//, '');
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = parsed.searchParams.get('v');
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const m = /^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/.exec(parsed.pathname);
    if (m) return m[1];
  }
  return null;
};
