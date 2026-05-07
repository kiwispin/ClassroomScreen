import type { CSSProperties } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type NotepadConfig = {
  text?: string;
  fontSize?: number;   // explicit pixel size, used when autoFit is false
  autoFit?: boolean;   // when true (default), font scales with widget size
};

export default function Notepad({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const text = cfg.text ?? '';
  const autoFit = cfg.autoFit ?? true;
  const fontSize = cfg.fontSize ?? 24;

  const textStyle: CSSProperties = autoFit
    ? { fontSize: 'clamp(14px,min(5cqi,11cqb),96px)', lineHeight: 1.45 }
    : { fontSize: `${fontSize}px`, lineHeight: 1.4 };

  return (
    <div
      className="h-full w-full"
      style={{ containerType: 'size' as const }}
    >
      <textarea
        value={text}
        onChange={(e) => updateConfig(instance.id, { text: e.target.value })}
        placeholder="Type a note for the class…"
        className="h-full w-full resize-none p-4 outline-none bg-transparent placeholder:text-current placeholder:opacity-40 font-medium"
        style={textStyle}
      />
    </div>
  );
}
