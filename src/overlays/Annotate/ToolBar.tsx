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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[210] bg-white/95 backdrop-blur rounded-full shadow-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
      <button
        onClick={() => p.setTool('pen')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center ' +
          (p.tool === 'pen' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
        title="Pen"
      >
        ✏️
      </button>
      <button
        onClick={() => p.setTool('eraser')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center ' +
          (p.tool === 'eraser' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
        title="Eraser"
      >
        🧽
      </button>
      <div className="w-px h-6 bg-slate-200 mx-1" />
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => {
            p.setColor(c);
            p.setTool('pen');
          }}
          className={
            'h-7 w-7 rounded-full border-2 ' +
            (p.color === c && p.tool === 'pen' ? 'border-slate-700' : 'border-transparent')
          }
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <input
        type="range"
        min={2}
        max={20}
        value={p.width}
        onChange={(e) => p.setWidth(Number(e.target.value))}
        className="w-20"
        title="Stroke width"
      />
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <button
        onClick={p.onUndo}
        disabled={!p.canUndo}
        className="px-3 py-1 rounded hover:bg-slate-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        title="Undo (⌘Z / Ctrl-Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={p.onClear}
        disabled={!p.canUndo}
        className="px-3 py-1 rounded hover:bg-slate-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Clear
      </button>
      <button
        onClick={p.onClose}
        className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
        title="Done (Esc)"
      >
        Done
      </button>
    </div>
  );
}
