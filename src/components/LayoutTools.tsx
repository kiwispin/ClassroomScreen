import { useEffect } from 'react';
import { LayoutGrid, Undo2, Redo2 } from 'lucide-react';
import { useAppStore } from '../store/store';
import { getWidgetMeta } from '../widgets/registry';
import WidgetSettingsPanel, { SettingsSection, SettingsToggle } from './WidgetSettingsPanel';
import { screenButton } from './ScreenDialog';
import type { Alignment } from '../lib/layout-history';

export function useLayoutShortcuts() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const state = useAppStore.getState();
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (state.annotateOpen || document.querySelector('[data-shortcuts-scope="local"]') || target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        if (key === 'y' || event.shiftKey) state.redoLayout(); else state.undoLayout();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function LayoutTools() {
  const state = useAppStore();
  const selected = state.current.widgets.filter((w) => state.selectedWidgetIds.includes(w.id) && !w.locked);
  const last = state.layoutPast[state.layoutPast.length - 1];
  const next = state.layoutFuture[state.layoutFuture.length - 1];
  return <div className="fixed right-3 top-16 z-[160] flex gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-md">
    <button className={screenButton + ' !px-2'} aria-label="Undo layout change" title={last ? `Undo: ${last.label}` : 'Undo layout change'} disabled={!last} onClick={state.undoLayout}><Undo2 className="h-4 w-4" /></button>
    <button className={screenButton + ' !px-2'} aria-label="Redo layout change" title={next ? `Redo: ${next.label}` : 'Redo layout change'} disabled={!next} onClick={state.redoLayout}><Redo2 className="h-4 w-4" /></button>
    <WidgetSettingsPanel title="Arrange widgets" trigger={(toggle, open, panelId) => <button className={screenButton + ' !px-2'} aria-label="Arrange widgets" aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" onClick={toggle}><LayoutGrid className="h-4 w-4" /></button>}>
      {() => <>
        <SettingsSection title="Snapping">
          <SettingsToggle label="Snap to grid" checked={state.snapToGrid ?? false} onChange={state.toggleSnapToGrid} />
          <p className="text-xs text-slate-500">Move and resize in 16-pixel steps. Turn off for free placement.</p>
        </SettingsSection>
        <SettingsSection title="Select widgets">
          <p className="text-xs text-slate-500">Choose two or more unlocked widgets to align. You can also Shift-click widgets on the screen.</p>
          {state.current.widgets.length === 0 && <p className="text-sm text-slate-500">Add a widget to get started.</p>}
          {state.current.widgets.map((w, index) => <label key={w.id} className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-indigo-500" checked={state.selectedWidgetIds.includes(w.id)} disabled={w.locked} onChange={() => state.selectWidget(w.id, true)} />
            {getWidgetMeta(w.type)?.label ?? w.type} {index + 1}{w.locked ? ' (locked)' : ''}
          </label>)}
          <button className={screenButton} disabled={!state.selectedWidgetIds.length} onClick={state.clearWidgetSelection}>Clear selection</button>
        </SettingsSection>
        <SettingsSection title="Align selection">
          <div className="grid grid-cols-3 gap-2">{(['left', 'center', 'right', 'top', 'middle', 'bottom'] as Alignment[]).map((alignment) => <button key={alignment} className={screenButton + ' capitalize'} disabled={selected.length < 2} onClick={() => state.alignSelectedWidgets(alignment)}>{alignment}</button>)}</div>
          <p className="text-xs text-slate-500">Aligns within the selection’s outer edges. Locked widgets stay in place.</p>
        </SettingsSection>
      </>}
    </WidgetSettingsPanel>
  </div>;
}
