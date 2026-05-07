import { Check, Eraser, Pencil, Trash2, Undo2 } from 'lucide-react';
import { useAppStore } from '../../store/store';

const COLORS = [
  '#111827',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#ffffff',
  '#2563eb',
  '#38bdf8',
  '#9333ea',
  '#ec4899',
];

const SIZES = [3, 8, 16];

const Divider = () => <div className="mx-1.5 h-12 w-px shrink-0 bg-slate-200/90" />;

export default function AnnotateToolBar() {
  const tool = useAppStore((s) => s.annotateTool);
  const color = useAppStore((s) => s.annotateColor);
  const width = useAppStore((s) => s.annotateWidth);
  const canUndo = useAppStore((s) => s.annotateCanUndo);
  const setTool = useAppStore((s) => s.setAnnotateTool);
  const setColor = useAppStore((s) => s.setAnnotateColor);
  const setWidth = useAppStore((s) => s.setAnnotateWidth);
  const undo = useAppStore((s) => s.requestAnnotateUndo);
  const clear = useAppStore((s) => s.requestAnnotateClear);
  const done = useAppStore((s) => s.toggleAnnotate);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => setTool('pen')}
        className={
          'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl transition-colors ' +
          (tool === 'pen'
            ? 'bg-slate-200/70 text-indigo-600'
            : 'text-slate-700 hover:bg-slate-100')
        }
        title="Pen"
        aria-label="Pen"
      >
        <Pencil className="h-8 w-8" strokeWidth={2.2} />
      </button>

      <button
        type="button"
        onClick={() => setTool('eraser')}
        className={
          'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl transition-colors ' +
          (tool === 'eraser'
            ? 'bg-slate-200/70 text-slate-950'
            : 'text-slate-700 hover:bg-slate-100')
        }
        title="Eraser"
        aria-label="Eraser"
      >
        <Eraser className="h-8 w-8" strokeWidth={2.2} />
      </button>

      <Divider />

      <div className="grid shrink-0 grid-cols-5 gap-x-2.5 gap-y-2 px-1">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={
              'h-7 w-7 rounded-full border transition-all ' +
              (color === c && tool === 'pen'
                ? 'scale-110 border-pink-500 ring-4 ring-pink-200'
                : c === '#ffffff'
                  ? 'border-slate-300'
                  : 'border-transparent')
            }
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
            title={`Color ${c}`}
          />
        ))}
      </div>

      <Divider />

      <div className="flex shrink-0 items-center gap-2">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setWidth(size)}
            className={
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors ' +
              (width === size ? 'bg-slate-200/80' : 'hover:bg-slate-100')
            }
            aria-label={`Stroke width ${size}`}
            title={`Stroke width ${size}`}
          >
            <span
              className="rounded-full bg-slate-900"
              style={{ width: size, height: size }}
              aria-hidden
            />
          </button>
        ))}
        <input
          type="range"
          min={2}
          max={24}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="hidden w-20 accent-indigo-500 lg:block"
          title="Stroke width"
          aria-label="Stroke width"
        />
      </div>

      <Divider />

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-base font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
        title="Undo"
      >
        <Undo2 className="h-5 w-5" strokeWidth={2.1} />
        <span className="hidden xl:inline">Undo</span>
      </button>
      <button
        type="button"
        onClick={clear}
        disabled={!canUndo}
        className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-base font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
        title="Clear"
      >
        <Trash2 className="h-5 w-5" strokeWidth={2.1} />
        <span className="hidden xl:inline">Clear</span>
      </button>
      <button
        type="button"
        onClick={done}
        className="ml-1 flex h-11 shrink-0 items-center gap-2 rounded-full bg-slate-700 px-4 text-base font-semibold text-white transition-colors hover:bg-slate-800"
        title="Done"
      >
        <Check className="h-5 w-5" strokeWidth={2.4} />
        <span>Done</span>
      </button>
    </div>
  );
}
