import { useState, type CSSProperties } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type NotepadConfig = {
  text?: string; fontSize?: number; autoFit?: boolean;
  fontFamily?: string; bold?: boolean; italic?: boolean; underline?: boolean;
  align?: 'left' | 'center' | 'right'; textColor?: string;
};
const fonts: Record<string, string> = {
  Sans: 'Arial, sans-serif', Rounded: '"Trebuchet MS", sans-serif',
  Serif: 'Georgia, serif', Mono: '"Courier New", monospace',
};
export default function Notepad({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore(s => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const [editing, setEditing] = useState(false);
  const patch = (value: Partial<NotepadConfig>) => updateConfig(instance.id, value);
  const textStyle: CSSProperties = {
    fontSize: (cfg.autoFit ?? true) ? 'clamp(18px,min(7cqi,13cqb),96px)' : `${cfg.fontSize ?? 28}px`,
    lineHeight: 1.4, fontFamily: fonts[cfg.fontFamily ?? 'Rounded'] ?? fonts.Rounded,
    fontWeight: cfg.bold ? 700 : 400, fontStyle: cfg.italic ? 'italic' : 'normal',
    textDecoration: cfg.underline ? 'underline' : 'none', textAlign: cfg.align ?? 'left',
    color: cfg.textColor ?? 'inherit',
  };
  const button = 'flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 aria-pressed:bg-indigo-100 aria-pressed:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500';
  return <div className="relative flex h-full w-full flex-col" style={{ containerType: 'size' }} onFocusCapture={() => setEditing(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setEditing(false); }}>
    {editing && <div role="toolbar" aria-label="Note formatting (whole note)" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1" onMouseDown={e => e.stopPropagation()}>
      <select aria-label="Note font" value={cfg.fontFamily ?? 'Rounded'} onChange={e => patch({ fontFamily: e.target.value })} className="h-8 w-24 shrink-0 rounded bg-transparent text-sm text-slate-700">{Object.keys(fonts).map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="Note font size" value={(cfg.autoFit ?? true) ? 'auto' : String(cfg.fontSize ?? 28)} onChange={e => patch(e.target.value === 'auto' ? { autoFit: true } : { autoFit: false, fontSize: Number(e.target.value) })} className="h-8 w-16 shrink-0 rounded bg-transparent text-sm text-slate-700">
        <option value="auto">Auto</option>{Array.from(new Set([16,20,24,28,32,40,48,64, cfg.fontSize ?? 28])).sort((a,b)=>a-b).map(size => <option key={size} value={size}>{size}</option>)}
      </select>
      <button type="button" className={button} aria-label="Bold note" aria-pressed={cfg.bold ?? false} onClick={() => patch({ bold: !cfg.bold })}><Bold className="h-4 w-4" /></button>
      <button type="button" className={button} aria-label="Italic note" aria-pressed={cfg.italic ?? false} onClick={() => patch({ italic: !cfg.italic })}><Italic className="h-4 w-4" /></button>
      <button type="button" className={button} aria-label="Underline note" aria-pressed={cfg.underline ?? false} onClick={() => patch({ underline: !cfg.underline })}><Underline className="h-4 w-4" /></button>
      {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => <button key={align} type="button" className={button} aria-label={`Align note ${align}`} aria-pressed={(cfg.align ?? 'left') === align} onClick={() => patch({ align })}><Icon className="h-4 w-4" /></button>)}
      <input type="color" aria-label="Note text colour" value={cfg.textColor ?? '#18202e'} onChange={e => patch({ textColor: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-1" />
    </div>}
    <textarea aria-label="Note text" value={cfg.text ?? ''} onChange={e => patch({ text: e.target.value })} placeholder="Enter your text here …" className="min-h-0 w-full flex-1 resize-none bg-transparent px-5 py-4 outline-none placeholder:font-normal placeholder:italic placeholder:text-current placeholder:opacity-50" style={textStyle} />
  </div>;
}
