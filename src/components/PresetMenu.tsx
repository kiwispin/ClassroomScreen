import { useRef, useState } from 'react';
import { Folder, Plus, Save, Pencil, Trash2, Download, Upload } from 'lucide-react';
import SettingsPopover from './SettingsPopover';
import NamePromptDialog from './NamePromptDialog';
import ConfirmDialog from './ConfirmDialog';
import ToolButton from './ToolButton';
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
  const switchToPreset = useAppStore((s) => s.switchToPreset);
  const updateActivePreset = useAppStore((s) => s.updateActivePreset);
  const renamePreset = useAppStore((s) => s.renamePreset);
  const deletePreset = useAppStore((s) => s.deletePreset);

  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <>
      <SettingsPopover
        trigger={(open) => (
          <ToolButton
            Icon={Folder}
            label={activeName ?? 'presets'}
            title={activeName ? `Preset: ${activeName}` : 'Presets'}
            active={Boolean(activeName)}
            iconColor="text-amber-600"
            onClick={open}
          />
        )}
      >
        {(closePopover) => (
          <div className="flex flex-col gap-2 w-64">
            <div className="text-xs uppercase text-slate-500">Switch to</div>
            {presets.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No presets yet.</div>
            ) : (
              <ul className="flex flex-col gap-1">
                {presets.map((p) => (
                  <li key={p.id} className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        switchToPreset(p.id);
                        closePopover();
                      }}
                      className={
                        'flex-1 text-left px-2 py-1 rounded text-sm ' +
                        (p.id === activeId
                          ? 'bg-slate-700 text-white'
                          : 'hover:bg-slate-100')
                      }
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() =>
                        setMode({ kind: 'rename', id: p.id, current: p.name })
                      }
                      className="h-7 w-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500"
                      title="Rename"
                      aria-label={`Rename ${p.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() =>
                        setMode({ kind: 'delete', id: p.id, name: p.name })
                      }
                      className="h-7 w-7 rounded hover:bg-rose-50 flex items-center justify-center text-rose-600"
                      title="Delete"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-200 mt-1 pt-2 flex flex-col gap-0.5">
              <button
                onClick={() => setMode({ kind: 'save-as' })}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-sm text-left"
              >
                <Plus className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span>Save current as preset…</span>
              </button>
              <button
                disabled={!activeId}
                onClick={() => {
                  updateActivePreset();
                  closePopover();
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span>Update active preset</span>
              </button>
            </div>

            <div className="border-t border-slate-200 mt-1 pt-2 flex flex-col gap-0.5">
              <button
                onClick={onExport}
                disabled={status.kind === 'busy'}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-sm text-left disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span>Export presets…</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={status.kind === 'busy'}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 text-sm text-left disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span>Import presets…</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onImport}
              />
            </div>

            {status.kind !== 'idle' && (
              <div
                className={
                  'mt-1 text-xs rounded px-2 py-1 ' +
                  (status.kind === 'busy'
                    ? 'bg-slate-100 text-slate-700'
                    : status.kind === 'ok'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800')
                }
              >
                {status.message}
              </div>
            )}
          </div>
        )}
      </SettingsPopover>

      <NamePromptDialog
        open={mode.kind === 'save-as'}
        title="Save current screen as preset"
        placeholder="e.g. Maths lesson"
        onCancel={close}
        onSubmit={(name) => {
          savePresetAs(name);
          close();
        }}
      />

      <NamePromptDialog
        open={mode.kind === 'rename'}
        title="Rename preset"
        initialValue={mode.kind === 'rename' ? mode.current : ''}
        onCancel={close}
        onSubmit={(name) => {
          if (mode.kind === 'rename') renamePreset(mode.id, name);
          close();
        }}
      />

      <ConfirmDialog
        open={mode.kind === 'delete'}
        title="Delete preset?"
        message={
          mode.kind === 'delete'
            ? `"${mode.name}" will be permanently deleted. The current screen is unaffected.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onCancel={close}
        onConfirm={() => {
          if (mode.kind === 'delete') deletePreset(mode.id);
          close();
        }}
      />
    </>
  );
}
