import { ArrowUp, ArrowDown, Star, X } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import type { WidgetType } from '../store/types';
import ScreenDialog, { screenButton } from './ScreenDialog';

export default function WidgetLibrary({ onClose }: { onClose: () => void }) {
  const preference = useAppStore((s) => s.toolbarWidgets);
  const setPreference = useAppStore((s) => s.setToolbarWidgets);
  const favourites = resolveToolbarWidgets(preference, allWidgets);
  const ids = favourites.map((w) => w.type);
  const toggle = (type: WidgetType) => setPreference(ids.includes(type) ? ids.filter((id) => id !== type) : [...ids, type]);
  const move = (index: number, delta: number) => {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setPreference(next);
  };
  return <ScreenDialog title="Edit widget bar" wide onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">Choose your favourites and put them in lesson order. Changes save automatically on this browser.</p>
      <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">On your widget bar</h3>
      {favourites.length === 0 && <p className="mb-4 rounded-md bg-slate-50 p-3 text-sm">No favourites yet. Add widgets from the list below; all widgets remain available in More.</p>}
      <ol className="mb-5 space-y-2">{favourites.map((w, index) => <li key={w.type} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
        <w.Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-500" />
        <span className="min-w-0 flex-1 text-sm font-medium">{index + 1}. {w.label}</span>
        <button className={screenButton + ' !px-2'} disabled={index === 0} aria-label={`Move ${w.label} earlier`} title="Move earlier" onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></button>
        <button className={screenButton + ' !px-2'} disabled={index === favourites.length - 1} aria-label={`Move ${w.label} later`} title="Move later" onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></button>
        <button className={screenButton + ' !px-2'} aria-label={`Remove ${w.label} from favourites`} title="Remove from favourites" onClick={() => toggle(w.type)}><X className="h-4 w-4" /></button>
      </li>)}</ol>
      <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Add to your widget bar</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{allWidgets.filter((w) => !ids.includes(w.type)).map((w) => <button key={w.type} className={screenButton + ' !justify-start'} onClick={() => toggle(w.type)} aria-label={`Add ${w.label} to favourites`}><Star className="h-4 w-4 shrink-0" />{w.label}</button>)}</div>
      <button className={screenButton + ' mt-5'} onClick={() => setPreference(allWidgets.filter((w) => !w.secondary).map((w) => w.type))}>Restore default bar</button>
  </ScreenDialog>;
}
