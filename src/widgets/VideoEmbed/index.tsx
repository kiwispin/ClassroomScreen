import { Film } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { parseYouTubeId } from './parse';

export type VideoEmbedConfig = { url?: string };

export default function VideoEmbed({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as VideoEmbedConfig;
  const id = parseYouTubeId(cfg.url ?? '');

  if (!id) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center gap-2 p-3 text-center"
        style={{ containerType: 'size' as const }}
      >
        <Film
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
          Paste a YouTube URL in ⚙ settings.
        </div>
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
