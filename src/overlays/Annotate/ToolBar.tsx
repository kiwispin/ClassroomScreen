import { Pencil, Eraser, Undo2, Trash2, Check } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#111827'];

type Props = {
  tool: 'pen' | 'eraser';
  setTool: (t: 'pen' | 'eraser') => void;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onClose: () => void;
};

export default function AnnotateToolBar(p: Props) {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[210] bg-white/95 backdrop-blur rounded-full shadow-md border border-slate-200/80 px-3 py-2 flex items-center gap-2">
      <button
        onClick={() => p.setTool('pen')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center transition-colors ' +
          (p.tool === 'pen'
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-100')
        }
        title="Pen"
        aria-label="Pen"
      >
        <Pencil className="w-4 h-4" strokeWidth={1.75} />
      </button>
      <button
        onClick={() => p.setTool('eraser')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center transition-colors ' +
          (p.tool === 'eraser'
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-100')
        }
        title="Eraser"
        aria-label="Eraser"
      >
        <Eraser className="w-4 h-4" strokeWidth={1.75} />
      </button>
      <div className="w-px h-6 bg-slate-200 mx-0.5" />
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => {
            p.setColor(c);
            p.setTool('pen');
          }}
          className={
            'h-7 w-7 rounded-full border-2 transition-all ' +
            (p.color === c && p.tool === 'pen'
              ? 'border-slate-700 scale-110'
              : 'border-transparent')
          }
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
      <div className="w-px h-6 bg-slate-200 mx-0.5" />
      <input
        type="range"
        min={2}
        max={20}
        value={p.width}
        onChange={(e) => p.setWidth(Number(e.target.value))}
        className="w-20"
        title="Stroke width"
      />
      <div className="w-px h-6 bg-slate-200 mx-0.5" />
      <button
        onClick={p.onUndo}
        disabled={!p.canUndo}
        className="h-9 px-3 rounded-full hover:bg-slate-100 text-sm flex items-center gap-1.5 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="Undo (⌘Z / Ctrl-Z)"
      >
        <Undo2 className="w-4 h-4" strokeWidth={1.75} />
        <span>Undo</span>
      </button>
      <button
        onClick={p.onClear}
        disabled={!p.canUndo}
        className="h-9 px-3 rounded-full hover:bg-slate-100 text-sm flex items-center gap-1.5 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        <span>Clear</span>
      </button>
      <button
        onClick={p.onClose}
        className="h-9 px-3 rounded-full bg-slate-700 text-white text-sm hover:bg-slate-800 flex items-center gap-1.5"
        title="Done (Esc)"
      >
        <Check className="w-4 h-4" strokeWidth={2} />
        <span>Done</span>
      </button>
    </div>
  );
}
