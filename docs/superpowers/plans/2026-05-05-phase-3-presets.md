# Phase 3 — Expanded SFX + Named Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (a) Expand the timer SFX library from 4 to ~10 chiptune-style sounds (fanfare, level-up, ta-da, coin, game-over, ding) without using copyrighted material. (b) Implement named presets so the user can save the current screen state as e.g. "Math lesson" or "Reading time" and switch between them in one click. (c) Clean up orphaned IDB images when a preset's image is no longer referenced.

**Architecture:** Presets live in `AppState.presets[]` and are deep-copied to/from `current` on switch. A preset menu lives at the right end of the toolbar (next to Background). New SFX are added as additional entries in `SCRIPTS` with multi-tone, chiptune-style melodies (square waves, fast attack, short notes). Image cleanup runs after switching presets and after deleting a preset.

**Tech Stack:** No new dependencies.

---

## File Structure

```
src/
  lib/audio.ts                      # extended SCRIPTS map (~10 SFX)
  lib/audio.test.ts                 # update SFX_NAMES expectation
  store/store.ts                    # adds preset actions
  store/store.test.ts               # tests for preset actions
  components/
    Toolbar.tsx                     # adds PresetMenu
    PresetMenu.tsx                  # NEW — dropdown w/ save / switch / rename / delete
    NamePromptDialog.tsx            # NEW — small modal for naming a preset
    ConfirmDialog.tsx               # NEW — confirm delete
  overlays/Background/
    cleanup.ts                      # NEW — orphaned image cleanup
    cleanup.test.ts                 # NEW
```

---

## Task 1: Expand the SFX library

**Files:**
- Modify: `src/lib/audio.ts`, `src/lib/audio.test.ts`

- [ ] **Step 1.1: Update the failing assertion**

In `src/lib/audio.test.ts`, replace the `SFX_NAMES` test:

```ts
  it('exports the expected SFX names', () => {
    expect(SFX_NAMES).toEqual([
      'bell',
      'chime',
      'alarm',
      'gentle',
      'fanfare',
      'levelup',
      'tada',
      'coin',
      'gameover',
      'ding',
    ]);
  });
```

Run: `npm test -- src/lib/audio.test.ts` → expected FAIL (count mismatch).

- [ ] **Step 1.2: Extend the SCRIPTS map**

In `src/lib/audio.ts`, replace the `SFX_NAMES` array and the `SCRIPTS` map:

```ts
export const SFX_NAMES = [
  'bell',
  'chime',
  'alarm',
  'gentle',
  'fanfare',
  'levelup',
  'tada',
  'coin',
  'gameover',
  'ding',
] as const;
```

Replace the body of `const SCRIPTS: Record<SfxName, Tone[]> = { ... }` with:

```ts
const SCRIPTS: Record<SfxName, Tone[]> = {
  bell: [
    { freq: 880, start: 0, duration: 0.6, type: 'sine', volume: 0.4 },
    { freq: 660, start: 0.18, duration: 0.6, type: 'sine', volume: 0.3 },
  ],
  chime: [
    { freq: 523.25, start: 0, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 659.25, start: 0.18, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 783.99, start: 0.36, duration: 0.5, type: 'triangle', volume: 0.35 },
  ],
  alarm: [
    { freq: 880, start: 0, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.28, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.56, duration: 0.18, type: 'square', volume: 0.25 },
  ],
  gentle: [
    { freq: 440, start: 0, duration: 0.8, type: 'sine', volume: 0.3 },
    { freq: 554.37, start: 0.4, duration: 0.8, type: 'sine', volume: 0.25 },
  ],
  // 8-bit style victory fanfare — G major arpeggio finishing on the tonic.
  fanfare: [
    { freq: 392.0,  start: 0.00, duration: 0.12, type: 'square', volume: 0.3 }, // G4
    { freq: 392.0,  start: 0.14, duration: 0.12, type: 'square', volume: 0.3 }, // G4
    { freq: 392.0,  start: 0.28, duration: 0.12, type: 'square', volume: 0.3 }, // G4
    { freq: 523.25, start: 0.42, duration: 0.30, type: 'square', volume: 0.35 }, // C5
    { freq: 659.25, start: 0.74, duration: 0.30, type: 'square', volume: 0.35 }, // E5
    { freq: 783.99, start: 1.06, duration: 0.50, type: 'square', volume: 0.35 }, // G5
  ],
  // Rapid ascending chiptune sweep
  levelup: [
    { freq: 261.63, start: 0.00, duration: 0.07, type: 'square', volume: 0.25 }, // C4
    { freq: 329.63, start: 0.08, duration: 0.07, type: 'square', volume: 0.25 }, // E4
    { freq: 392.0,  start: 0.16, duration: 0.07, type: 'square', volume: 0.25 }, // G4
    { freq: 523.25, start: 0.24, duration: 0.07, type: 'square', volume: 0.25 }, // C5
    { freq: 659.25, start: 0.32, duration: 0.07, type: 'square', volume: 0.25 }, // E5
    { freq: 783.99, start: 0.40, duration: 0.07, type: 'square', volume: 0.25 }, // G5
    { freq: 1046.5, start: 0.48, duration: 0.20, type: 'square', volume: 0.30 }, // C6
  ],
  // Two-chord triumph: V → I, "ta-DAH!"
  tada: [
    { freq: 392.0,  start: 0.00, duration: 0.18, type: 'square', volume: 0.30 }, // G4
    { freq: 493.88, start: 0.00, duration: 0.18, type: 'square', volume: 0.20 }, // B4
    { freq: 587.33, start: 0.00, duration: 0.18, type: 'square', volume: 0.18 }, // D5
    { freq: 523.25, start: 0.22, duration: 0.50, type: 'square', volume: 0.30 }, // C5
    { freq: 659.25, start: 0.22, duration: 0.50, type: 'square', volume: 0.22 }, // E5
    { freq: 783.99, start: 0.22, duration: 0.50, type: 'square', volume: 0.20 }, // G5
  ],
  // Mario-coin-style 2-note pop
  coin: [
    { freq: 987.77, start: 0.00, duration: 0.06, type: 'square', volume: 0.30 }, // B5
    { freq: 1318.5, start: 0.07, duration: 0.20, type: 'square', volume: 0.30 }, // E6
  ],
  // Descending minor — classic "game over" cue
  gameover: [
    { freq: 392.0,  start: 0.00, duration: 0.20, type: 'square', volume: 0.30 }, // G4
    { freq: 369.99, start: 0.22, duration: 0.20, type: 'square', volume: 0.28 }, // F#4
    { freq: 311.13, start: 0.44, duration: 0.20, type: 'square', volume: 0.26 }, // D#4
    { freq: 261.63, start: 0.66, duration: 0.50, type: 'square', volume: 0.30 }, // C4
  ],
  // Single bright bell ping
  ding: [
    { freq: 1318.5, start: 0.00, duration: 0.40, type: 'sine', volume: 0.35 },
  ],
};
```

Run: `npm test -- src/lib/audio.test.ts` → expected 3 passing.

- [ ] **Step 1.3: Verify the timer settings UI auto-shows the new sounds**

The `TimerSettings` component already maps over `SFX_NAMES`, so all 10 buttons show automatically. No code change there.

- [ ] **Step 1.4: Smoke-test in browser**

```bash
npm run dev
```

Add a Timer, open ⚙. There should now be 10 SFX buttons. Click each one — they preview. Set the timer to 5 seconds, pick `fanfare`, hit Start.

- [ ] **Step 1.5: Commit**

```bash
git add -A
git commit -m "feat: expand timer SFX library to 10 chiptune-style sounds"
```

---

## Task 2: Add preset actions to the store

**Files:**
- Modify: `src/store/store.ts`, `src/store/store.test.ts`

- [ ] **Step 2.1: Failing tests**

Append inside `describe('app store', ...)` in `src/store/store.test.ts`:

```ts
  it('savePresetAs creates a new preset from current state', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('Maths');
    const s = useAppStore.getState();
    expect(s.presets).toHaveLength(1);
    expect(s.presets[0].name).toBe('Maths');
    expect(s.presets[0].state.widgets).toHaveLength(1);
    expect(s.activePresetId).toBe(s.presets[0].id);
  });

  it('switchToPreset replaces current with a deep copy', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('A');
    const aId = useAppStore.getState().presets[0].id;

    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('B');
    expect(useAppStore.getState().current.widgets).toHaveLength(2);

    useAppStore.getState().switchToPreset(aId);
    const s = useAppStore.getState();
    expect(s.current.widgets).toHaveLength(1);
    expect(s.activePresetId).toBe(aId);

    // Mutating current should not mutate the preset
    useAppStore.getState().addWidget('demo');
    expect(useAppStore.getState().current.widgets).toHaveLength(2);
    const presetA = useAppStore.getState().presets.find((p) => p.id === aId)!;
    expect(presetA.state.widgets).toHaveLength(1);
  });

  it('updateActivePreset writes current state into the active preset', () => {
    useAppStore.getState().savePresetAs('A');
    const aId = useAppStore.getState().presets[0].id;
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().updateActivePreset();
    const a = useAppStore.getState().presets.find((p) => p.id === aId)!;
    expect(a.state.widgets).toHaveLength(1);
  });

  it('renamePreset changes the name', () => {
    useAppStore.getState().savePresetAs('A');
    const id = useAppStore.getState().presets[0].id;
    useAppStore.getState().renamePreset(id, 'Beta');
    expect(useAppStore.getState().presets[0].name).toBe('Beta');
  });

  it('deletePreset removes by id and clears activePresetId if matched', () => {
    useAppStore.getState().savePresetAs('A');
    const id = useAppStore.getState().presets[0].id;
    expect(useAppStore.getState().activePresetId).toBe(id);
    useAppStore.getState().deletePreset(id);
    expect(useAppStore.getState().presets).toHaveLength(0);
    expect(useAppStore.getState().activePresetId).toBeNull();
  });
```

Run: `npm test -- src/store/store.test.ts` → expected FAIL (5 missing actions).

- [ ] **Step 2.2: Implement**

In `src/store/store.ts`, extend the `Actions` type:

```ts
type Actions = {
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, width: number, height: number) => void;
  focusWidget: (id: string) => void;
  updateWidgetConfig: (id: string, patch: Record<string, unknown>) => void;
  setBackground: (bg: import('./types').Background) => void;
  toggleAnnotate: () => void;
  savePresetAs: (name: string) => void;
  switchToPreset: (id: string) => void;
  updateActivePreset: () => void;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
};
```

Add helpers near the top of the file (after `nextZIndex`):

```ts
const cloneScreen = <T,>(s: T): T => JSON.parse(JSON.stringify(s));
```

Add the action implementations alongside the others (after `toggleAnnotate`):

```ts
      savePresetAs: (name) =>
        set((s) => {
          const id = newId();
          const now = Date.now();
          return {
            presets: [
              ...s.presets,
              {
                id,
                name,
                state: cloneScreen(s.current),
                createdAt: now,
                updatedAt: now,
              },
            ],
            activePresetId: id,
          };
        }),

      switchToPreset: (id) =>
        set((s) => {
          const p = s.presets.find((p) => p.id === id);
          if (!p) return {};
          return {
            current: cloneScreen(p.state),
            activePresetId: id,
          };
        }),

      updateActivePreset: () =>
        set((s) => {
          if (!s.activePresetId) return {};
          const now = Date.now();
          return {
            presets: s.presets.map((p) =>
              p.id === s.activePresetId
                ? { ...p, state: cloneScreen(s.current), updatedAt: now }
                : p,
            ),
          };
        }),

      renamePreset: (id, name) =>
        set((s) => ({
          presets: s.presets.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
          ),
        })),

      deletePreset: (id) =>
        set((s) => ({
          presets: s.presets.filter((p) => p.id !== id),
          activePresetId: s.activePresetId === id ? null : s.activePresetId,
        })),
```

Run: `npm test -- src/store/store.test.ts` → expected 15 passing.

- [ ] **Step 2.3: Commit**

```bash
git add -A
git commit -m "feat(store): add preset save/switch/update/rename/delete actions"
```

---

## Task 3: Build the NamePromptDialog and ConfirmDialog shared components

**Files:**
- Create: `src/components/NamePromptDialog.tsx`, `src/components/ConfirmDialog.tsx`

- [ ] **Step 3.1: Name prompt dialog**

Create `src/components/NamePromptDialog.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
};

export default function NamePromptDialog({
  open, title, initialValue = '', placeholder, onCancel, onSubmit,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, initialValue]);

  if (!open) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/30 flex items-center justify-center"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium text-slate-800 mb-2">{title}</h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full border border-slate-300 rounded px-2 py-1 mb-3 outline-none focus:border-slate-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded hover:bg-slate-100 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2: Confirm dialog**

Create `src/components/ConfirmDialog.tsx`:

```tsx
type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', destructive, onCancel, onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/30 flex items-center justify-center"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium text-slate-800 mb-1">{title}</h2>
        <p className="text-sm text-slate-600 mb-3">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded hover:bg-slate-100 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={
              'px-3 py-1 rounded text-white text-sm ' +
              (destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-800')
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.3: Commit**

```bash
git add -A
git commit -m "feat: add NamePromptDialog + ConfirmDialog shared components"
```

---

## Task 4: Build the PresetMenu

**Files:**
- Create: `src/components/PresetMenu.tsx`
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 4.1: PresetMenu component**

Create `src/components/PresetMenu.tsx`:

```tsx
import { useState } from 'react';
import SettingsPopover from './SettingsPopover';
import NamePromptDialog from './NamePromptDialog';
import ConfirmDialog from './ConfirmDialog';
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
          <button
            onClick={open}
            className="h-9 px-3 rounded hover:bg-slate-100 text-sm flex items-center gap-1"
            title="Presets"
          >
            📁 <span>{activeName ? `Preset: ${activeName}` : 'Presets'}</span>
          </button>
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
```

- [ ] **Step 4.2: Wire into Toolbar**

Replace the contents of `src/components/Toolbar.tsx`:

```tsx
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import PresetMenu from './PresetMenu';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);

  return (
    <div className="absolute top-0 left-0 right-0 h-12 z-50 flex items-center gap-1 px-3 bg-white/90 backdrop-blur shadow-sm">
      {allWidgets.map((w) => (
        <button
          key={w.type}
          onClick={() => addWidget(w.type)}
          title={`Add ${w.label}`}
          className="h-9 w-9 rounded hover:bg-slate-100 flex items-center justify-center text-xl"
        >
          {w.icon}
        </button>
      ))}
      <button
        onClick={toggleAnnotate}
        title="Annotate"
        className={
          'h-9 px-3 rounded text-sm flex items-center gap-1 ' +
          (annotateOpen ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
      >
        ✏️ <span>Annotate</span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <PresetMenu />
        </div>
        <div className="relative">
          <BackgroundPicker />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.3: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser:
1. Add a Notepad with some text + a Clock. Click Presets → "Save current as preset…" → name it "A". Toolbar now shows "Preset: A".
2. Add a Timer. Click Presets → "Save current as preset…" → name it "B". Now "Preset: B".
3. Click Presets → click "A" — Timer disappears, only Notepad+Clock remain. Toolbar shows "Preset: A".
4. Add a Stopwatch (the demo widget) — current state diverges from preset. Click Presets → "Update active preset" → switching elsewhere and back retains the change.
5. Rename "A" → "Math".
6. Delete "Math" — confirm dialog → confirmed → preset gone.

- [ ] **Step 4.4: Commit**

```bash
git add -A
git commit -m "feat: add named-preset menu (save / switch / rename / delete)"
```

---

## Task 5: Orphaned image cleanup

**Files:**
- Create: `src/overlays/Background/cleanup.ts`, `src/overlays/Background/cleanup.test.ts`
- Modify: `src/store/store.ts`

The store doesn't directly delete IDB entries because actions are sync. We need a side-effect: subscribe to the store and prune IDB images that are no longer referenced.

- [ ] **Step 5.1: Cleanup utility + test**

Create `src/overlays/Background/cleanup.ts`:

```ts
import { keys } from 'idb-keyval';
import { createStore } from 'idb-keyval';
import { deleteImage } from './idb';
import type { AppState } from '../../store/types';

const imageStore = createStore('classroomscreen', 'images');

export const collectReferencedImageIds = (s: Pick<AppState, 'current' | 'presets'>): Set<string> => {
  const ids = new Set<string>();
  if (s.current.background.kind === 'image') ids.add(s.current.background.imageId);
  for (const p of s.presets) {
    if (p.state.background.kind === 'image') ids.add(p.state.background.imageId);
  }
  return ids;
};

export const pruneOrphanImages = async (
  s: Pick<AppState, 'current' | 'presets'>,
): Promise<number> => {
  const referenced = collectReferencedImageIds(s);
  const allKeys = (await keys(imageStore)) as string[];
  let removed = 0;
  for (const key of allKeys) {
    if (!referenced.has(key)) {
      await deleteImage(key);
      removed += 1;
    }
  }
  return removed;
};
```

Create `src/overlays/Background/cleanup.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { putImage } from './idb';
import { collectReferencedImageIds, pruneOrphanImages } from './cleanup';
import type { AppState } from '../../store/types';

const baseState = (): Pick<AppState, 'current' | 'presets'> => ({
  current: {
    widgets: [],
    background: { kind: 'solid', color: '#fff' },
  },
  presets: [],
});

describe('collectReferencedImageIds', () => {
  it('collects ids from current and presets', () => {
    const s = baseState();
    s.current.background = { kind: 'image', imageId: 'a', fit: 'cover' };
    s.presets.push({
      id: 'p1', name: 'p', createdAt: 0, updatedAt: 0,
      state: { widgets: [], background: { kind: 'image', imageId: 'b', fit: 'cover' } },
    });
    const ids = collectReferencedImageIds(s);
    expect(ids).toEqual(new Set(['a', 'b']));
  });
});

describe('pruneOrphanImages', () => {
  it('removes IDB entries that are not referenced', async () => {
    const used = await putImage(new Blob(['used']));
    const orphan = await putImage(new Blob(['orphan']));

    const s = baseState();
    s.current.background = { kind: 'image', imageId: used, fit: 'cover' };

    const removed = await pruneOrphanImages(s);
    expect(removed).toBe(1);
    // The orphan is gone, used remains
    const { getImage } = await import('./idb');
    expect(await getImage(orphan)).toBeUndefined();
    expect(await getImage(used)).toBeDefined();
  });
});
```

Run: `npm test -- src/overlays/Background/cleanup.test.ts` → expected 2 passing.

- [ ] **Step 5.2: Trigger cleanup after preset switch + delete**

Subscribing to the store + scheduling cleanup is the cleanest way without coupling the store to IDB. Add a top-level subscription in `src/main.tsx`.

Edit `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';
import { useAppStore } from './store/store';
import { pruneOrphanImages } from './overlays/Background/cleanup';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Periodically prune orphaned images. Cheap because keys() on a small store
// is fast, and most refreshes will find nothing to do.
let pruneScheduled = false;
const schedulePrune = () => {
  if (pruneScheduled) return;
  pruneScheduled = true;
  setTimeout(() => {
    pruneScheduled = false;
    pruneOrphanImages(useAppStore.getState()).catch(() => {
      /* ignore */
    });
  }, 1500);
};

useAppStore.subscribe((s, prev) => {
  if (s.current.background !== prev.current.background || s.presets !== prev.presets) {
    schedulePrune();
  }
});

// One pass at startup to clean anything left over from a prior session.
schedulePrune();
```

- [ ] **Step 5.3: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser:
1. Upload a background image → it stores in IDB.
2. Switch to a solid color → after ~1.5s, the orphan should be pruned (verify via DevTools → Application → IndexedDB → classroomscreen → images: count drops to 0).
3. Upload another image → save preset "X" → upload a different image → save preset "Y" → switch to "X" → "Y" image should NOT be pruned (still referenced by preset Y).
4. Delete preset "Y" → after ~1.5s, Y's image should be pruned.

- [ ] **Step 5.4: Commit**

```bash
git add -A
git commit -m "feat: prune orphaned IDB images on background/preset changes"
```

---

## Task 6: Push and verify deploy

- [ ] **Step 6.1: Push**

```bash
git push
gh run watch --exit-status
```

- [ ] **Step 6.2: Verify live**

Open `https://kiwispin.github.io/ClassroomScreen/`:
1. Save a couple of presets.
2. Switch between them.
3. Upload a background image and switch presets — image follows the preset (each preset can have its own background).
4. Refresh — presets persist, active selection persists.

---

## Phase 3 done — verification checklist

- [ ] `npm test` passes (added: 5 preset action tests, 2 cleanup tests; updated audio test for 10 SFX).
- [ ] Timer settings show 10 SFX choices, including fanfare/levelup/tada/coin/gameover/ding.
- [ ] Toolbar right side shows: 📁 Presets, 🖌️ Background.
- [ ] Save / switch / rename / delete presets all work; switching deep-copies state so editing doesn't mutate the saved preset.
- [ ] "Update active preset" writes the current state into the active preset.
- [ ] Orphaned IDB images get pruned within ~1.5s of becoming unreferenced.
- [ ] Live GitHub Pages URL behaves identically.

When all boxes are ticked, Phase 3 is done. Move on to Phase 4 (Tier 2 widgets) by writing a new plan.
