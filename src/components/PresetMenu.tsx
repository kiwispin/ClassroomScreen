import { useState } from 'react';
import { Folder } from 'lucide-react';
import SettingsPopover from './SettingsPopover';
import NamePromptDialog from './NamePromptDialog';
import ConfirmDialog from './ConfirmDialog';
import ToolButton from './ToolButton';
import { useAppStore } from '../store/store';

type Mode =
  | { kind: 'none' }
  | { kind: 'save-as' }
  | { kind: 'rename'; id: string; current: string }
  | { kind: 'delete'; id: string; name: string };

export default function PresetMenu() {
  const presets = useAppStore((s) => s.presets);
  const activeId = useAppStore((s) => s.activePresetId);
  const savePresetAs = useAppStore((s) => s.savePresetAs);
  const switchToPreset = useAppStore((s) => s.switchToPreset);
  const updateActivePreset = useAppStore((s) => s.updateActivePreset);
  const renamePreset = useAppStore((s) => s.renamePreset);
  const deletePreset = useAppStore((s) => s.deletePreset);

  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const close = () => setMode({ kind: 'none' });

  const activeName = presets.find((p) => p.id === activeId)?.name ?? null;

  return (
    <>
      <SettingsPopover
        trigger={(open) => (
          <ToolButton
            Icon={Folder}
            label={activeName ?? 'presets'}
            title={activeName ? `Preset: ${activeName}` : 'Presets'}
            active={Boolean(activeName)}
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
                      className="h-7 w-7 rounded hover:bg-slate-100 text-xs"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() =>
                        setMode({ kind: 'delete', id: p.id, name: p.name })
                      }
                      className="h-7 w-7 rounded hover:bg-red-50 text-red-600 text-xs"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-slate-200 mt-1 pt-2 flex flex-col gap-1">
              <button
                onClick={() => {
                  setMode({ kind: 'save-as' });
                }}
                className="px-2 py-1 rounded hover:bg-slate-100 text-sm text-left"
              >
                ➕ Save current as preset…
              </button>
              <button
                disabled={!activeId}
                onClick={() => {
                  updateActivePreset();
                  closePopover();
                }}
                className="px-2 py-1 rounded hover:bg-slate-100 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Update active preset
              </button>
            </div>
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
