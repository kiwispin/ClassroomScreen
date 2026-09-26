import { useRef, useState } from 'react';
import { Folder, Plus, Save, Pencil, Trash2, Download, Upload, CalendarClock, Copy, ArrowLeft, ArrowRight } from 'lucide-react';
import ScreenDialog, { screenButton, screenInput } from './ScreenDialog';
import PresetPreview from './PresetPreview';
import { usePresetSwitch } from './PresetNavigation';
import ToolButton from './ToolButton';
import ScheduleEditor from './ScheduleEditor';
import { useAppStore } from '../store/store';
import { exportToFile, importFromFile, type ImportResult } from '../lib/preset-io';

type Mode =
  | { kind: 'none' }
  | { kind: 'save-as' }
  | { kind: 'rename'; id: string; current: string }
  | { kind: 'delete'; id: string; name: string };

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; message: string }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export default function PresetMenu() {
  const presets = useAppStore((s) => s.presets);
  const activeId = useAppStore((s) => s.activePresetId);
  const savePresetAs = useAppStore((s) => s.savePresetAs);
  const duplicatePreset = useAppStore((s) => s.duplicatePreset);
  const movePreset = useAppStore((s) => s.movePreset);
  const current = useAppStore((s) => s.current);
  const { request, confirmation } = usePresetSwitch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const updateActivePreset = useAppStore((s) => s.updateActivePreset);
  const renamePreset = useAppStore((s) => s.renamePreset);
  const deletePreset = useAppStore((s) => s.deletePreset);

  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scheduleEnabled = useAppStore((s) => s.scheduleEnabled);
  const scheduleCount = useAppStore((s) => s.schedule.length);

  const close = () => setMode({ kind: 'none' });
  const activeName = presets.find((p) => p.id === activeId)?.name ?? null;

  const showStatus = (next: Status, autoClearMs = 3000) => {
    setStatus(next);
    if (next.kind === 'ok' || next.kind === 'error') {
      setTimeout(() => {
        setStatus((cur) => (cur === next ? { kind: 'idle' } : cur));
      }, autoClearMs);
    }
  };

  const onExport = async () => {
    if (presets.length === 0) {
      showStatus({ kind: 'error', message: 'No presets to export yet.' });
      return;
    }
    showStatus({ kind: 'busy', message: 'Preparing file…' });
    try {
      await exportToFile();
      showStatus({ kind: 'ok', message: `Exported ${presets.length} preset${presets.length === 1 ? '' : 's'}.` });
    } catch (e) {
      showStatus({ kind: 'error', message: (e as Error).message ?? 'Export failed.' });
    }
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    showStatus({ kind: 'busy', message: 'Reading file…' });
    try {
      const r: ImportResult = await importFromFile(file);
      const parts: string[] = [`${r.presetsAdded} preset${r.presetsAdded === 1 ? '' : 's'}`];
      if (r.imagesAdded) parts.push(`${r.imagesAdded} image${r.imagesAdded === 1 ? '' : 's'}`);
      if (r.audioAdded) parts.push(`${r.audioAdded} sound${r.audioAdded === 1 ? '' : 's'}`);
      showStatus({ kind: 'ok', message: `Imported ${parts.join(', ')}.` });
    } catch (err) {
      showStatus({ kind: 'error', message: (err as Error).message ?? 'Import failed.' });
    }
  };

  const active = presets.find((p) => p.id === activeId);
  const dirty = active && JSON.stringify(active.state) !== JSON.stringify(current);
  const filtered = presets.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <ToolButton Icon={Folder} label={activeName ?? 'presets'} title="Saved screens" active={Boolean(activeName)} iconColor="text-amber-600" onClick={() => setOpen(true)} />
    {open && <ScreenDialog title="Saved screens" wide onClose={() => setOpen(false)}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={screenButton} onClick={() => { setName(''); setMode({ kind: 'save-as' }); }}><Plus className="h-4 w-4" />Save current as preset</button>
        <button className={screenButton} disabled={!activeId} onClick={() => { updateActivePreset(); showStatus({ kind: 'ok', message: 'Screen updated.' }); }}><Save className="h-4 w-4" />Update active preset</button>
        {dirty && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
      </div>
      <label className="mb-4 block"><span className="sr-only">Find a saved screen</span><input className={screenInput} type="search" placeholder="Find a saved screen…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      {presets.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><Folder className="mx-auto mb-3 h-8 w-8 text-indigo-400" /><p className="font-medium">Your lessons, ready to open</p><p className="mt-1 text-sm text-slate-500">Arrange your widgets, then save your first screen above.</p></div>
        : filtered.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No screens match your search.</p>
        : <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((p) => {
          const index = presets.findIndex((item) => item.id === p.id);
          const selected = p.id === activeId;
          return <li key={p.id} className={`min-w-0 overflow-hidden rounded-lg border ${selected ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-200' : 'border-slate-200 bg-white'}`}>
            <button className="block w-full p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500" aria-label={`Open ${p.name}`} aria-current={selected ? 'true' : undefined} onClick={() => { request(p.id); setOpen(false); }}>
              <PresetPreview state={p.state} />
              <span className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-800">{p.name}</span>{selected && <span className="text-xs font-medium text-indigo-600">Active</span>}</span>
              <span className="mt-1 block text-xs text-slate-500">{index + 1} · {p.state.widgets.length} widgets</span>
            </button>
            <div className="flex flex-wrap gap-1 border-t border-slate-200 px-2 py-2">
              <button className={screenButton + ' !px-2'} aria-label={`Rename ${p.name}`} title="Rename" onClick={() => { setName(p.name); setMode({ kind: 'rename', id: p.id, current: p.name }); }}><Pencil className="h-4 w-4" /></button>
              <button className={screenButton + ' !px-2'} aria-label={`Duplicate ${p.name}`} title="Duplicate" onClick={() => { duplicatePreset(p.id); showStatus({ kind: 'ok', message: `Duplicated ${p.name}.` }); }}><Copy className="h-4 w-4" /></button>
              <button className={screenButton + ' !px-2'} aria-label={`Move ${p.name} earlier`} title="Move earlier" disabled={index === 0 || Boolean(query.trim())} onClick={() => movePreset(p.id, -1)}><ArrowLeft className="h-4 w-4" /></button>
              <button className={screenButton + ' !px-2'} aria-label={`Move ${p.name} later`} title="Move later" disabled={index === presets.length - 1 || Boolean(query.trim())} onClick={() => movePreset(p.id, 1)}><ArrowRight className="h-4 w-4" /></button>
              <button className={screenButton + ' !px-2 text-rose-600'} aria-label={`Delete ${p.name}`} title="Delete" onClick={() => setMode({ kind: 'delete', id: p.id, name: p.name })}><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>;
        })}</ul>}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        <button className={screenButton} onClick={() => setScheduleOpen(true)}><CalendarClock className="h-4 w-4" />Schedule{scheduleEnabled && scheduleCount ? ` (${scheduleCount} on)` : ''}</button>
        <button className={screenButton} onClick={onExport} disabled={status.kind === 'busy' || !presets.length}><Download className="h-4 w-4" />Export</button>
        <button className={screenButton} onClick={() => fileInputRef.current?.click()} disabled={status.kind === 'busy'}><Upload className="h-4 w-4" />Import</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </div>
      <p className="mt-3 text-xs text-slate-500">Saved on this browser. Export a backup to use your screens elsewhere. Cards show a simplified layout preview.</p>
      {status.kind !== 'idle' && <p role={status.kind === 'error' ? 'alert' : 'status'} className="mt-3 rounded-md bg-slate-100 p-3 text-sm">{status.message}</p>}
    </ScreenDialog>}
    {(mode.kind === 'save-as' || mode.kind === 'rename') && <ScreenDialog title={mode.kind === 'save-as' ? 'Save current screen' : 'Rename preset'} onClose={close}>
      <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; if (mode.kind === 'save-as') savePresetAs(name.trim()); else if (mode.kind === 'rename') renamePreset(mode.id, name.trim()); close(); }}>
        <label className="block text-sm font-medium">Screen name<input data-initial-focus className={screenInput + ' mt-2'} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maths lesson" /></label>
        <div className="mt-4 flex justify-end gap-2"><button type="button" className={screenButton} onClick={close}>Cancel</button><button className={screenButton} disabled={!name.trim()}>Save</button></div>
      </form>
    </ScreenDialog>}
    {mode.kind === 'delete' && <ScreenDialog title="Delete preset?" onClose={close}>
      <p className="text-sm">“{mode.name}” and its schedule rules will be deleted. Your current screen stays open.</p>
      <div className="mt-4 flex justify-end gap-2"><button className={screenButton} onClick={close}>Cancel</button><button className={screenButton + ' text-rose-700'} onClick={() => { deletePreset(mode.id); close(); }}>Delete</button></div>
    </ScreenDialog>}
    <ScheduleEditor open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    {confirmation}
  </>;
}
