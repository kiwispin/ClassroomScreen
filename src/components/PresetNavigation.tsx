import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN } from '../store/types';
import ScreenDialog, { screenButton } from './ScreenDialog';

export function usePresetSwitch() {
  const [pending, setPending] = useState<string | null>(null);
  const request = (id: string) => {
    const state = useAppStore.getState();
    if (id === state.activePresetId || !state.presets.some((p) => p.id === id)) return;
    const active = state.presets.find((p) => p.id === state.activePresetId);
    if (JSON.stringify(active?.state ?? DEFAULT_SCREEN) !== JSON.stringify(state.current)) setPending(id);
    else state.switchToPreset(id);
  };
  const finish = (save: boolean) => {
    const state = useAppStore.getState();
    if (save) {
      if (state.activePresetId) state.updateActivePreset();
      else state.savePresetAs(`Untitled screen ${state.presets.length + 1}`);
    }
    if (pending) useAppStore.getState().switchToPreset(pending);
    setPending(null);
  };
  const confirmation = pending && <ScreenDialog title="Save changes before switching?" onClose={() => setPending(null)}>
    <p className="mb-4 text-sm">Your current screen has changes that are not saved in a preset.</p>
    <div className="flex flex-wrap justify-end gap-2">
      <button className={screenButton} onClick={() => setPending(null)}>Cancel</button>
      <button className={screenButton} onClick={() => finish(false)}>Switch without saving</button>
      <button className={screenButton} onClick={() => finish(true)}>Save and switch</button>
    </div>
  </ScreenDialog>;
  return { request, confirmation };
}

export default function PresetNavigation() {
  const presets = useAppStore((s) => s.presets);
  const activeId = useAppStore((s) => s.activePresetId);
  const index = presets.findIndex((p) => p.id === activeId);
  const { request, confirmation } = usePresetSwitch();
  if (presets.length < 2) return null;
  return <>
    <nav aria-label="Lesson screens" className="fixed left-3 top-3 z-[150] flex max-w-[calc(100vw-112px)] items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-md">
      <button className={screenButton} aria-label="Previous screen" disabled={index <= 0} onClick={() => request(presets[index - 1].id)}><ChevronLeft className="h-4 w-4" /></button>
      <span className="min-w-0 px-2 text-center text-xs text-slate-600" aria-live="polite"><span className="block max-w-40 truncate font-medium text-slate-800">{presets[index]?.name ?? 'Unsaved screen'}</span>{index + 1} / {presets.length}</span>
      <button className={screenButton} aria-label="Next screen" disabled={index >= presets.length - 1} onClick={() => request(presets[index + 1].id)}><ChevronRight className="h-4 w-4" /></button>
    </nav>
    {confirmation}
  </>;
}
