import { useState } from 'react';
import { ArrowUp, ArrowDown, Star, X } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import type { WidgetType } from '../store/types';
import ScreenDialog, { screenButton, screenInput } from './ScreenDialog';
import ToolButton from './ToolButton';

const groups: { title: string; types: WidgetType[] }[] = [
  { title: 'Time & planning', types: ['clock', 'timer', 'stopwatch', 'calendar', 'timetable'] },
  { title: 'Classroom tools', types: ['notepad', 'trafficlight', 'worksymbols', 'noisemeter'] },
  { title: 'Participation', types: ['namepicker', 'dice', 'poll'] },
  { title: 'Media & links', types: ['image', 'video', 'qrcode'] },
];

export default function WidgetLibrary({ onClose }: { onClose: () => void }) {
  const preference = useAppStore((s) => s.toolbarWidgets);
  const setPreference = useAppStore((s) => s.setToolbarWidgets);
  const widgets = useAppStore((s) => s.current.widgets);
  const addWidget = useAppStore((s) => s.addWidget);
  const favourites = resolveToolbarWidgets(preference, allWidgets);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const ids = favourites.map((w) => w.type);
  const toggle = (type: WidgetType) => setPreference(ids.includes(type) ? ids.filter((id) => id !== type) : [...ids, type]);
  const move = (index: number, delta: number) => {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setPreference(next);
  };
  return <ScreenDialog title={editing ? 'Edit widget bar' : 'More widgets'} wide onClose={onClose}>
    <div className="mb-4 flex flex-wrap gap-2">
      <button className={screenButton} aria-pressed={!editing} onClick={() => setEditing(false)}>Add widgets</button>
      <button className={screenButton} aria-pressed={editing} onClick={() => setEditing(true)}>Edit widget bar</button>
    </div>
    {editing ? <>
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
    </> : <>
      <label className="mb-4 block"><span className="sr-only">Find a widget</span><input className={screenInput} type="search" value={query} placeholder="Find a widget…" onChange={(e) => setQuery(e.target.value)} /></label>
      {groups.map((group) => {
        const matches = allWidgets.filter((w) => group.types.includes(w.type) && `${w.label} ${w.type} ${group.title}`.toLowerCase().includes(query.trim().toLowerCase()));
        if (!matches.length) return null;
        return <section key={group.title} className="mb-5"><h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{group.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{matches.map((w) => <div key={w.type} className="relative rounded-lg border border-slate-200 bg-slate-50/40 p-1">
            <ToolButton Icon={w.Icon} label={w.label.toLowerCase()} title={`Add ${w.label}`} iconColor={w.iconColor} variant="popover" instanceCount={widgets.filter((instance) => instance.type === w.type).length} onClick={() => { addWidget(w.type); onClose(); }} />
            <button type="button" className="flex min-h-10 w-full items-center justify-center gap-1 rounded-md text-xs text-slate-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500" aria-pressed={ids.includes(w.type)} aria-label={`${ids.includes(w.type) ? 'Remove' : 'Add'} ${w.label} ${ids.includes(w.type) ? 'from' : 'to'} favourites`} onClick={() => toggle(w.type)}><Star className="h-3.5 w-3.5" fill={ids.includes(w.type) ? 'currentColor' : 'none'} />{ids.includes(w.type) ? 'Favourite' : 'Add favourite'}</button>
          </div>)}</div>
        </section>;
      })}
      {!allWidgets.some((w) => groups.some((g) => g.types.includes(w.type) && `${w.label} ${w.type} ${g.title}`.toLowerCase().includes(query.trim().toLowerCase()))) && <p className="py-8 text-center text-sm text-slate-500">No widgets match your search.</p>}
      <p className="text-xs text-slate-500">Dots and counts show what is on the current screen. Adding a widget creates another copy.</p>
    </>}
  </ScreenDialog>;
}
