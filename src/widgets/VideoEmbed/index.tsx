import type { WidgetInstance } from '../../store/types';
import { parseYouTubeId } from './parse';

export type VideoEmbedConfig = { url?: string };

export default function VideoEmbed({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as VideoEmbedConfig;
  const id = parseYouTubeId(cfg.url ?? '');

  if (!id) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm p-3 text-center">
        Paste a YouTube URL in ⚙ settings.
      </div>
    );
  }

  return (
    <iframe
      title="YouTube video"
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      className="h-full w-full bg-black"
      frameBorder={0}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
