# Phase 6 — Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quality-of-life polish that turns the app from "functionally complete" into "comfortable to actually teach with": auto-hiding toolbar, native fullscreen mode, keyboard shortcuts, a help overlay, and a small visual pass.

**Architecture:** Toolbar gains a hide/pin behavior driven by mouse-idle detection. A small `useFullscreen` hook wraps the Fullscreen API. A single `useGlobalShortcuts` hook listens for app-wide hotkeys. The shortcut help overlay is a portal-rendered dialog. Tile chrome gets a softer style.

**Tech Stack additions:** None.

---

## File Structure

```
src/components/
  Toolbar.tsx               # gains hide/pin behavior + Fullscreen + Help buttons
  HelpOverlay.tsx           # NEW — keyboard-shortcut cheat sheet
src/lib/
  useFullscreen.ts          # NEW — hook around Fullscreen API
  useGlobalShortcuts.ts     # NEW — global keydown listener
src/components/WidgetTile.tsx   # softer chrome
```

---

## Task 1: useFullscreen hook + toolbar button

**Files:**
- Create: `src/lib/useFullscreen.ts`
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1.1: Create the hook**

Create `src/lib/useFullscreen.ts`:

```ts
import { useEffect, useState, useCallback } from 'react';

export function useFullscreen() {
  const [isFs, setIsFs] = useState<boolean>(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* ignore */ });
    } else {
      document.documentElement.requestFullscreen?.().catch(() => { /* ignore */ });
    }
  }, []);

  return { isFs, toggle };
}
```

- [ ] **Step 1.2: Add a Fullscreen ToolButton to the right of Annotate**

Edit `src/components/Toolbar.tsx`. Add the import:

```tsx
import { useFullscreen } from '../lib/useFullscreen';
```

Inside the component, after `toggleAnnotate`, add:

```tsx
  const { isFs, toggle: toggleFs } = useFullscreen();
```

Add a ToolButton after the Annotate button:

```tsx
        <ToolButton
          icon={isFs ? '🗗' : '⛶'}
          label="fullscreen"
          title={isFs ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          active={isFs}
          onClick={toggleFs}
        />
```

- [ ] **Step 1.3: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser: click ⛶ — page goes fullscreen. Click again or press Esc — exits fullscreen. The icon and label flip.

- [ ] **Step 1.4: Commit**

```bash
git add -A
git commit -m "feat: add fullscreen toolbar button + useFullscreen hook"
```

---

## Task 2: Global keyboard shortcuts + Help overlay

**Files:**
- Create: `src/lib/useGlobalShortcuts.ts`, `src/components/HelpOverlay.tsx`
- Modify: `src/app/App.tsx`, `src/components/Toolbar.tsx`

Shortcuts:
- `A` toggles Annotate
- `F` toggles fullscreen
- `?` toggles the help overlay
- `Esc` closes the help overlay

(Annotate's own `Esc`-to-close and `⌘/Ctrl-Z` undo are already handled inside the overlay.)

The hook should ignore key presses while the user is typing in any input/textarea/contentEditable element.

- [ ] **Step 2.1: Create the shortcuts hook**

Create `src/lib/useGlobalShortcuts.ts`:

```ts
import { useEffect } from 'react';

const isTypingTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
};

export type ShortcutMap = Record<string, () => void>;

export function useGlobalShortcuts(map: ShortcutMap) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return; // leave modified combos alone here
      if (isTypingTarget(e.target)) return;
      const handler = map[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map]);
}
```

- [ ] **Step 2.2: Create the help overlay**

Create `src/components/HelpOverlay.tsx`:

```tsx
import { createPortal } from 'react-dom';

type Row = { keys: string[]; description: string };

const ROWS: Row[] = [
  { keys: ['A'], description: 'Toggle Annotate' },
  { keys: ['F'], description: 'Toggle fullscreen' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close annotate / dialog / help' },
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
```

- [ ] **Step 2.3: Wire into App.tsx**

Replace the contents of `src/app/App.tsx`:

```tsx
import { useState } from 'react';
import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import AnnotateOverlay from '../overlays/Annotate';
import HelpOverlay from '../components/HelpOverlay';
import { useAppStore } from '../store/store';
import { useFullscreen } from '../lib/useFullscreen';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';

export default function App() {
  const bg = useAppStore((s) => s.current.background);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const { toggle: toggleFs } = useFullscreen();
  const [helpOpen, setHelpOpen] = useState(false);

  useGlobalShortcuts({
    a: () => toggleAnnotate(),
    A: () => toggleAnnotate(),
    f: () => toggleFs(),
    F: () => toggleFs(),
    '?': () => setHelpOpen((v) => !v),
    Escape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (annotateOpen) toggleAnnotate();
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer bg={bg} />
      <WidgetCanvas />
      <Toolbar onOpenHelp={() => setHelpOpen(true)} />
      <AnnotateOverlay />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2.4: Add a Help ToolButton in Toolbar**

Edit `src/components/Toolbar.tsx`. Update the props signature to accept `onOpenHelp`:

```tsx
type Props = { onOpenHelp: () => void };

export default function Toolbar({ onOpenHelp }: Props) {
```

After the Fullscreen button, add:

```tsx
        <ToolButton
          icon="?"
          label="help"
          title="Keyboard shortcuts (?)"
          onClick={onOpenHelp}
        />
```

- [ ] **Step 2.5: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser:
- Press `A` — annotate toggles
- Press `F` — fullscreen toggles
- Press `?` — help overlay appears with shortcut list
- Press `Esc` — overlay closes, then annotate closes
- Type in a Notepad — letters typed don't trigger shortcuts

- [ ] **Step 2.6: Commit**

```bash
git add -A
git commit -m "feat: keyboard shortcuts (A / F / ? / Esc) with help overlay"
```

---

## Task 3: Auto-hiding toolbar with pin

**Files:**
- Modify: `src/components/Toolbar.tsx`, `src/store/store.ts` (already has `toolbarPinned`)

When the user's mouse is idle for 4 seconds, the toolbar slides off the bottom of the viewport. It reappears when the mouse moves anywhere. A pin button keeps it always visible.

- [ ] **Step 3.1: Wire `toolbarPinned` action**

Edit `src/store/store.ts`. Extend the `Actions` type:

```ts
type Actions = {
  /* …existing actions… */
  toggleToolbarPinned: () => void;
};
```

Add the action body alongside `toggleAnnotate`:

```ts
      toggleToolbarPinned: () => set((s) => ({ toolbarPinned: !s.toolbarPinned })),
```

- [ ] **Step 3.2: Add idle-hide behavior to Toolbar**

Replace the contents of `src/components/Toolbar.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';
import { useFullscreen } from '../lib/useFullscreen';

const IDLE_MS = 4_000;

type Props = { onOpenHelp: () => void };

export default function Toolbar({ onOpenHelp }: Props) {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const pinned = useAppStore((s) => s.toolbarPinned);
  const togglePinned = useAppStore((s) => s.toggleToolbarPinned);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (pinned) {
      setVisible(true);
      return;
    }
    let timer: number | null = null;
    const arm = () => {
      if (timer) window.clearTimeout(timer);
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), IDLE_MS);
    };
    const onMove = () => arm();
    const onKey = () => arm();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    arm();
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  return (
    <div
      className={
        'fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3 pointer-events-none transition-transform duration-200 ' +
        (visible ? 'translate-y-0' : 'translate-y-[120%]')
      }
    >
      <div className="pointer-events-auto rounded-2xl shadow-lg border border-slate-200 bg-white/95 backdrop-blur px-2 py-1.5 flex items-center gap-1 max-w-[calc(100vw-24px)] overflow-x-auto">
        {allWidgets.map((w) => (
          <ToolButton
            key={w.type}
            icon={w.icon}
            label={w.label.toLowerCase()}
            title={`Add ${w.label}`}
            onClick={() => addWidget(w.type)}
          />
        ))}
        <div className="shrink-0 w-px h-10 bg-slate-200 mx-0.5" />
        <ToolButton
          icon="✏️"
          label="annotate"
          title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
          active={annotateOpen}
          onClick={toggleAnnotate}
        />
        <ToolButton
          icon={isFs ? '🗗' : '⛶'}
          label="fullscreen"
          title={isFs ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          active={isFs}
          onClick={toggleFs}
        />
        <ToolButton
          icon="?"
          label="help"
          title="Keyboard shortcuts (?)"
          onClick={onOpenHelp}
        />
        <ToolButton
          icon={pinned ? '📌' : '📍'}
          label={pinned ? 'pinned' : 'auto-hide'}
          title={pinned ? 'Toolbar pinned (click to auto-hide)' : 'Toolbar auto-hides (click to pin)'}
          active={pinned}
          onClick={togglePinned}
        />
        <div className="shrink-0 w-px h-10 bg-slate-200 mx-0.5" />
        <PresetMenu />
        <BackgroundPicker />
      </div>
    </div>
  );
}
```

- [ ] **Step 3.3: Verify**

```bash
npm run dev
```

- Mouse moves → toolbar visible
- Stop moving → after 4s the toolbar slides off-screen
- Move again → it slides back
- Click the 📍 button → it becomes 📌 and stays put forever
- Click again → reverts to auto-hide

- [ ] **Step 3.4: Commit**

```bash
git add -A
git commit -m "feat: auto-hide toolbar on mouse idle, with pin toggle"
```

---

## Task 4: Visual polish on widget tile chrome

**Files:**
- Modify: `src/components/WidgetTile.tsx`

The current tile header is a flat slate-50 bar that fades in on hover. Soften it: smaller header, subtler background, rounded corners that match the tile, slightly larger close button, gear and close grouped on the right with a tighter rhythm.

- [ ] **Step 4.1: Edit WidgetTile**

Replace the contents of `src/components/WidgetTile.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { WidgetInstance } from '../store/types';
import { getWidgetComponent, getWidgetMeta } from '../widgets/registry';
import { useAppStore } from '../store/store';

export default function WidgetTile({ instance }: { instance: WidgetInstance }) {
  const removeWidget = useAppStore((s) => s.removeWidget);
  const Component = getWidgetComponent(instance.type);
  const meta = getWidgetMeta(instance.type);

  if (!Component || !meta) {
    return (
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2 rounded-xl">
        Unknown widget: {instance.type}
      </div>
    );
  }

  let settingsBtn: ReactNode = null;
  if (meta.Settings) {
    const Settings = meta.Settings;
    settingsBtn = <Settings instance={instance} />;
  }

  return (
    <div className="h-full w-full flex flex-col rounded-xl shadow-md ring-1 ring-slate-200/70 bg-white overflow-hidden group relative">
      <div className="absolute top-0 left-0 right-0 h-7 px-2 flex items-center justify-between bg-gradient-to-b from-white/95 to-white/70 backdrop-blur text-slate-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move z-10 select-none">
        <span className="font-medium tracking-wide uppercase">{meta.label}</span>
        <div className="flex items-center gap-0.5">
          {settingsBtn}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(instance.id);
            }}
            className="h-6 w-6 rounded-md hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800"
            aria-label={`Remove ${meta.label}`}
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Component instance={instance} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Verify**

```bash
npm run dev
```

The tile shadow is now softer with a subtle border ring. The header is gradient/blurred and the label is small uppercase. Hover any tile to see it.

- [ ] **Step 4.3: Commit**

```bash
git add -A
git commit -m "style: soften widget tile chrome (rounded ring + gradient header)"
```

---

## Task 5: Push & verify deploy

- [ ] **Step 5.1: Push**

```bash
git push
gh run watch --exit-status
```

- [ ] **Step 5.2: Verify live**

Open the live URL and run through:
1. `A` toggles Annotate, `F` toggles fullscreen, `?` shows help, `Esc` cascades-closes
2. Toolbar auto-hides after 4s, returns on any mouse move
3. Pin button keeps it visible permanently
4. Tiles look softer and more polished

---

## Phase 6 done — verification checklist

- [ ] `npm test` passes (no new tests; behavior is interactive).
- [ ] Toolbar shows: widgets… | annotate / fullscreen / help / pin | presets / background.
- [ ] Auto-hide works; pin keeps it visible; both states persist (`toolbarPinned` is in localStorage).
- [ ] `?` opens the help overlay, lists all shortcuts, dismisses with `Esc`/click-outside.
- [ ] Fullscreen button + `F` shortcut both work and the icon flips.
- [ ] Live URL behaves identically.

When ticked, the project is feature complete vs. the original spec.
