import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import ToolButton from './ToolButton';

export default function MoreWidgets({ anchor, onClose, onEdit }: {
  anchor: RefObject<HTMLButtonElement>;
  onClose: (restoreFocus?: boolean) => void;
  onEdit: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ right: 12, bottom: 120 });
  const preference = useAppStore(s => s.toolbarWidgets);
  const widgets = useAppStore(s => s.current.widgets);
  const addWidget = useAppStore(s => s.addWidget);
  const favourites = resolveToolbarWidgets(preference, allWidgets);
  const extra = allWidgets.filter(w => !favourites.some(f => f.type === w.type));
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (rect) setPosition({ right: Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - 332)), bottom: window.innerHeight - rect.top + 16 });
    };
    place();
    panel.current?.querySelector('button')?.focus();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor]);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node)) onClose(false);
    };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true); };
  }, [anchor, onClose]);
  return <div ref={panel} id="more-widgets-popup" role="dialog" aria-label="More widgets" className="fixed z-[350] flex w-80 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl" style={{ ...position, maxHeight: `calc(100dvh - ${position.bottom + 12}px)` }}>
    <button type="button" onClick={onEdit} className="shrink-0 border-b border-slate-100 px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500">Edit widget bar</button>
    <div className="grid min-h-0 grid-cols-4 gap-1 overflow-y-auto overscroll-contain p-2">
      {extra.map(w => <ToolButton key={w.type} Icon={w.Icon} label={w.label.toLowerCase()} title={`Add ${w.label}`} iconColor={w.iconColor} variant="popover" instanceCount={widgets.filter(i => i.type === w.type).length} onClick={() => { addWidget(w.type); onClose(); }} />)}
    </div>
    {!extra.length && <p className="p-4 text-center text-sm text-slate-500">All widgets are on your bar.</p>}
  </div>;
}
