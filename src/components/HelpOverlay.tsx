import { createPortal } from 'react-dom';

type Row = { keys: string[]; description: string };

const ROWS: Row[] = [
  { keys: ['A'], description: 'Toggle Annotate' },
  { keys: ['F'], description: 'Toggle fullscreen' },
  { keys: ['Z'], description: 'Toggle focus mode (hide all chrome)' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close help / focus / annotate / dialog' },
  { keys: ['⌘/Ctrl', 'Z'], description: 'Undo last annotate stroke (in annotate mode)' },
];

export default function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[420px] max-w-[calc(100vw-32px)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1.5 pr-3 w-32">
                  <span className="flex flex-wrap gap-1">
                    {r.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-700 text-xs font-mono"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </td>
                <td className="py-1.5 text-slate-700">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">
          Shortcuts are ignored while typing in inputs.
        </p>
      </div>
    </div>,
    document.body,
  );
}
