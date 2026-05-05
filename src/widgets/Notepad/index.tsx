import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type NotepadConfig = { text?: string; fontSize?: number };

export default function Notepad({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const text = cfg.text ?? '';
  const fontSize = cfg.fontSize ?? 16;

  return (
    <textarea
      value={text}
      onChange={(e) => updateConfig(instance.id, { text: e.target.value })}
      placeholder="Type a note for the class…"
      className="h-full w-full resize-none p-3 outline-none bg-yellow-50 text-slate-800 placeholder:text-slate-400"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
    />
  );
}
