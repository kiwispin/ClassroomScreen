# Phase 2 — Tier 1 Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the five widgets the user uses every day: Notepad, Clock, Countdown Timer (with sound effects), customizable Background (solid / gradient / uploaded image), and the full-screen Annotate overlay. By end of Phase 2, the app is genuinely usable in a classroom for the most common workflows.

**Architecture:** Each widget is a folder under `src/widgets/`. Each provides a body component, a settings popover, and metadata for the registry. The store gains an `updateWidgetConfig` action and a `setBackground` action. Image uploads live in IndexedDB via a thin `idb-keyval` wrapper. Audio for the Timer is synthesized via the Web Audio API (no external MP3 assets required). The Annotate overlay is a separate layer in the App shell, not a tile.

**Tech Stack additions:** `idb-keyval` (IndexedDB wrapper), Web Audio API (no library).

---

## File Structure

After Phase 2 completes:

```
src/
  app/App.tsx                       # extends background renderer + Annotate overlay
  store/store.ts                    # adds updateWidgetConfig, setBackground, toggleAnnotate
  widgets/
    registry.ts                     # registers Notepad, Clock, Timer
    Demo/                           # untouched
    Notepad/
      index.tsx
      meta.ts
      Settings.tsx
      Notepad.test.ts
    Clock/
      index.tsx
      meta.ts
      Settings.tsx
      Clock.test.ts
    Timer/
      index.tsx
      meta.ts
      Settings.tsx
      Timer.test.ts                 # countdown math
  overlays/
    Background/
      index.tsx                     # full-screen layer
      Picker.tsx                    # toolbar popover
      idb.ts                        # IndexedDB image store
      idb.test.ts
      resize.ts                     # image downscale on upload
      resize.test.ts
    Annotate/
      index.tsx                     # full-screen canvas
      ToolBar.tsx                   # color/eraser/clear/width controls
  components/
    Toolbar.tsx                     # adds Background button + Annotate button
    SettingsPopover.tsx             # shared popover container for widget settings
  lib/
    audio.ts                        # Web Audio SFX synth
    audio.test.ts
```

---

## Task 1: Extend the store with `updateWidgetConfig`, `setBackground`, `toggleAnnotate`

**Files:**
- Modify: `src/store/store.ts`, `src/store/store.test.ts`

- [ ] **Step 1.1: Add failing tests**

Append to `src/store/store.test.ts` (inside the existing `describe('app store', ...)` block):

```ts
  it('updateWidgetConfig merges into the widget config', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetConfig(id, { fontSize: 24 });
    const w = useAppStore.getState().current.widgets[0];
    expect(w.config).toEqual({ fontSize: 24 });

    useAppStore.getState().updateWidgetConfig(id, { color: 'red' });
    const w2 = useAppStore.getState().current.widgets[0];
    expect(w2.config).toEqual({ fontSize: 24, color: 'red' });
  });

  it('setBackground replaces the current background', () => {
    useAppStore.getState().setBackground({ kind: 'solid', color: '#000' });
    expect(useAppStore.getState().current.background).toEqual({
      kind: 'solid',
      color: '#000',
    });
  });

  it('toggleAnnotate flips the flag', () => {
    expect(useAppStore.getState().annotateOpen).toBe(false);
    useAppStore.getState().toggleAnnotate();
    expect(useAppStore.getState().annotateOpen).toBe(true);
    useAppStore.getState().toggleAnnotate();
    expect(useAppStore.getState().annotateOpen).toBe(false);
  });
```

Run: `npm test -- src/store/store.test.ts` → expected FAIL.

- [ ] **Step 1.2: Implement**

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
};
```

Add the three actions to the store body (alongside the existing `focusWidget`):

```ts
      updateWidgetConfig: (id, patch) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, config: { ...w.config, ...patch } } : w,
            ),
          },
        })),

      setBackground: (bg) =>
        set((s) => ({
          current: { ...s.current, background: bg },
        })),

      toggleAnnotate: () => set((s) => ({ annotateOpen: !s.annotateOpen })),
```

Run: `npm test -- src/store/store.test.ts` → expected 10 passing.

- [ ] **Step 1.3: Commit**

```bash
git add -A
git commit -m "feat(store): add updateWidgetConfig, setBackground, toggleAnnotate"
```

---

## Task 2: Build the SettingsPopover shell

**Files:**
- Create: `src/components/SettingsPopover.tsx`

A small reusable popover anchored to a trigger element. Used by every widget that has settings (Notepad, Clock, Timer, etc.).

- [ ] **Step 2.1: Implement**

Create `src/components/SettingsPopover.tsx`:

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
};

export default function SettingsPopover({ trigger, children }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          ref={popRef}
          className="absolute right-0 top-full mt-1 z-[100] min-w-56 rounded-lg shadow-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2.2: Add a settings-slot to WidgetTile**

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
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2">
        Unknown widget: {instance.type}
      </div>
    );
  }

  let header: ReactNode = null;
  if (meta.Settings) {
    const Settings = meta.Settings;
    header = <Settings instance={instance} />;
  }

  return (
    <div className="h-full w-full flex flex-col rounded-lg shadow bg-white overflow-hidden group relative">
      <div className="absolute top-0 left-0 right-0 h-7 px-2 flex items-center justify-between bg-slate-50/95 text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move z-10">
        <span>{meta.label}</span>
        <div className="flex items-center gap-1">
          {header}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(instance.id);
            }}
            className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
            aria-label={`Remove ${meta.label}`}
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

- [ ] **Step 2.3: Extend WidgetMeta to allow an optional Settings component**

In `src/widgets/Demo/meta.ts`, replace the file contents:

```ts
import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../../store/types';

export type WidgetSettingsProps = { instance: WidgetInstance };

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
  Settings?: ComponentType<WidgetSettingsProps>;
};

export const demoMeta: WidgetMeta = {
  type: 'demo',
  label: 'Demo',
  icon: '🧪',
  defaultSize: { width: 240, height: 160 },
  defaultConfig: {},
};
```

(The shared `WidgetMeta` type now lives here. Other widgets will import it from `../Demo/meta`. We'll lift it to a shared location later if it grows; YAGNI for now.)

Update the import in `src/widgets/registry.ts` if needed — it already re-exports `WidgetMeta` from `./Demo/meta`.

- [ ] **Step 2.4: Verify build + tests**

```bash
npm run build && npm test
```

Expected: build succeeds, 17 tests pass (10 store + 4 registry + 2 uuid + 1 smoke).

- [ ] **Step 2.5: Commit**

```bash
git add -A
git commit -m "feat: add SettingsPopover + extend WidgetMeta with Settings slot"
```

---

## Task 3: Build the Notepad widget

**Files:**
- Create: `src/widgets/Notepad/index.tsx`, `src/widgets/Notepad/meta.ts`, `src/widgets/Notepad/Settings.tsx`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 3.1: Body**

Create `src/widgets/Notepad/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type NotepadConfig = { text?: string; fontSize?: number };

export default function Notepad({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const text = cfg.text ?? '';
  const fontSize = cfg.fontSize ?? 16;

  return (
    <textarea
      value={text}
      onChange={(e) => updateConfig(instance.id, { text: e.target.value })}
      placeholder="Type a note for the class…"
      className="h-full w-full resize-none p-3 outline-none bg-yellow-50 text-slate-800 placeholder:text-slate-400"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
    />
  );
}
```

- [ ] **Step 3.2: Settings popover**

Create `src/widgets/Notepad/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type NotepadConfig = { text?: string; fontSize?: number };

export default function NotepadSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NotepadConfig;
  const fontSize = cfg.fontSize ?? 16;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Notepad settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-3">
            <span>Font size</span>
            <span className="text-slate-500">{fontSize}px</span>
          </label>
          <input
            type="range"
            min={12}
            max={48}
            step={1}
            value={fontSize}
            onChange={(e) =>
              updateConfig(instance.id, { fontSize: Number(e.target.value) })
            }
          />
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 3.3: Metadata**

Create `src/widgets/Notepad/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import NotepadSettings from './Settings';

export const notepadMeta: WidgetMeta = {
  type: 'notepad',
  label: 'Notepad',
  icon: '📝',
  defaultSize: { width: 360, height: 240 },
  defaultConfig: { text: '', fontSize: 16 },
  Settings: NotepadSettings,
};
```

- [ ] **Step 3.4: Register**

Replace the contents of `src/widgets/registry.ts`:

```ts
import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../store/types';

import DemoWidget from './Demo';
import { demoMeta, type WidgetMeta } from './Demo/meta';
import Notepad from './Notepad';
import { notepadMeta } from './Notepad/meta';

export type WidgetProps = { instance: WidgetInstance };

type Entry = {
  meta: WidgetMeta;
  Component: ComponentType<WidgetProps>;
};

const registry: Partial<Record<WidgetType, Entry>> = {
  demo: { meta: demoMeta, Component: DemoWidget },
  notepad: { meta: notepadMeta, Component: Notepad },
};

export const allWidgets: WidgetMeta[] = Object.values(registry)
  .filter((e): e is Entry => Boolean(e))
  .map((e) => e.meta);

export const getWidgetMeta = (type: WidgetType): WidgetMeta | undefined =>
  registry[type]?.meta;

export const getWidgetComponent = (
  type: WidgetType,
): ComponentType<WidgetProps> | undefined => registry[type]?.Component;
```

- [ ] **Step 3.5: Use the widget's defaultSize when adding**

The store currently uses a hardcoded `240×160` initial size for every widget. Now that widgets have their own `defaultSize`, use it. In `src/store/store.ts`, modify the `addWidget` action:

Replace:

```ts
              {
                id: newId(),
                type,
                position: { x: 80, y: 80 },
                size: { width: 240, height: 160 },
                zIndex: nextZIndex(s.current.widgets),
                config: {},
              },
```

with:

```ts
              {
                id: newId(),
                type,
                position: { x: 80, y: 80 },
                size: getDefaultSize(type),
                zIndex: nextZIndex(s.current.widgets),
                config: getDefaultConfig(type),
              },
```

At the top of the file, after the imports, add helper functions:

```ts
import { getWidgetMeta } from '../widgets/registry';

const FALLBACK_SIZE = { width: 240, height: 160 };

const getDefaultSize = (type: WidgetType): { width: number; height: number } =>
  getWidgetMeta(type)?.defaultSize ?? FALLBACK_SIZE;

const getDefaultConfig = (type: WidgetType): Record<string, unknown> =>
  getWidgetMeta(type)?.defaultConfig ?? {};
```

- [ ] **Step 3.6: Verify**

```bash
npm test && npm run build
```

Expected: tests pass, build succeeds.

Smoke-test in browser:

```bash
npm run dev
```

Click the 📝 button — a yellow notepad tile appears. Type into it. Hover the tile, click ⚙ — popover with font-size slider. Drag slider — text resizes live. Click × — tile removes. Refresh — text persists.

- [ ] **Step 3.7: Commit**

```bash
git add -A
git commit -m "feat: add Notepad widget with font-size setting"
```

---

## Task 4: Build the Clock widget

**Files:**
- Create: `src/widgets/Clock/index.tsx`, `src/widgets/Clock/meta.ts`, `src/widgets/Clock/Settings.tsx`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 4.1: Body**

Create `src/widgets/Clock/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
};

const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

const pad = (n: number) => n.toString().padStart(2, '0');

export default function Clock({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as ClockConfig;
  const showSeconds = cfg.showSeconds ?? false;
  const now = useNow(showSeconds ? 1000 : 15000);

  const format24 = cfg.format24 ?? true;
  const showDate = cfg.showDate ?? true;

  let h = now.getHours();
  let suffix = '';
  if (!format24) {
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
  }
  const time = `${pad(h)}:${pad(now.getMinutes())}${
    showSeconds ? `:${pad(now.getSeconds())}` : ''
  }${suffix}`;

  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none">
      <div className="font-bold tabular-nums text-[clamp(28px,18cqw,128px)]"
           style={{ containerType: 'inline-size' as const }}>
        {time}
      </div>
      {showDate && <div className="text-sm text-slate-500 mt-1">{date}</div>}
    </div>
  );
}
```

- [ ] **Step 4.2: Settings popover**

Create `src/widgets/Clock/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
};

export default function ClockSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ClockConfig;

  const Toggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Clock settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2">
          <Toggle
            label="24-hour"
            value={cfg.format24 ?? true}
            onChange={(v) => updateConfig(instance.id, { format24: v })}
          />
          <Toggle
            label="Show seconds"
            value={cfg.showSeconds ?? false}
            onChange={(v) => updateConfig(instance.id, { showSeconds: v })}
          />
          <Toggle
            label="Show date"
            value={cfg.showDate ?? true}
            onChange={(v) => updateConfig(instance.id, { showDate: v })}
          />
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 4.3: Metadata + register**

Create `src/widgets/Clock/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import ClockSettings from './Settings';

export const clockMeta: WidgetMeta = {
  type: 'clock',
  label: 'Clock',
  icon: '⏰',
  defaultSize: { width: 280, height: 140 },
  defaultConfig: { format24: true, showSeconds: false, showDate: true },
  Settings: ClockSettings,
};
```

In `src/widgets/registry.ts`, add the import and registry entry:

```ts
import Clock from './Clock';
import { clockMeta } from './Clock/meta';
```

```ts
  clock: { meta: clockMeta, Component: Clock },
```

- [ ] **Step 4.4: Verify**

```bash
npm test && npm run build && npm run dev
```

In the browser: click ⏰ — clock appears showing current time and date. Open settings — toggle 12h, seconds, date. Each updates live.

- [ ] **Step 4.5: Commit**

```bash
git add -A
git commit -m "feat: add Clock widget"
```

---

## Task 5: Build the Web Audio SFX module

**Files:**
- Create: `src/lib/audio.ts`, `src/lib/audio.test.ts`

- [ ] **Step 5.1: Failing test**

Create `src/lib/audio.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SFX_NAMES, playSfx } from './audio';

describe('audio', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports the expected SFX names', () => {
    expect(SFX_NAMES).toEqual(['bell', 'chime', 'alarm', 'gentle']);
  });

  it('playSfx returns silently when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(() => playSfx('bell')).not.toThrow();
  });

  it('playSfx invokes AudioContext when available', () => {
    const fakeOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const fakeGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const fakeCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => fakeOsc),
      createGain: vi.fn(() => fakeGain),
      close: vi.fn(),
    };
    const Mock = vi.fn(() => fakeCtx);
    vi.stubGlobal('AudioContext', Mock);
    playSfx('bell');
    expect(Mock).toHaveBeenCalled();
    expect(fakeCtx.createOscillator).toHaveBeenCalled();
    expect(fakeOsc.start).toHaveBeenCalled();
  });
});
```

Run: `npm test -- src/lib/audio.test.ts` → expected FAIL.

- [ ] **Step 5.2: Implement**

Create `src/lib/audio.ts`:

```ts
export const SFX_NAMES = ['bell', 'chime', 'alarm', 'gentle'] as const;
export type SfxName = (typeof SFX_NAMES)[number];

type Tone = { freq: number; start: number; duration: number; type?: OscillatorType; volume?: number };

const SCRIPTS: Record<SfxName, Tone[]> = {
  // Two short bell strikes
  bell: [
    { freq: 880, start: 0, duration: 0.6, type: 'sine', volume: 0.4 },
    { freq: 660, start: 0.18, duration: 0.6, type: 'sine', volume: 0.3 },
  ],
  // Rising chime
  chime: [
    { freq: 523.25, start: 0, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 659.25, start: 0.18, duration: 0.4, type: 'triangle', volume: 0.35 },
    { freq: 783.99, start: 0.36, duration: 0.5, type: 'triangle', volume: 0.35 },
  ],
  // Repeating square-wave alarm
  alarm: [
    { freq: 880, start: 0, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.28, duration: 0.18, type: 'square', volume: 0.25 },
    { freq: 880, start: 0.56, duration: 0.18, type: 'square', volume: 0.25 },
  ],
  // Soft sine sweep
  gentle: [
    { freq: 440, start: 0, duration: 0.8, type: 'sine', volume: 0.3 },
    { freq: 554.37, start: 0.4, duration: 0.8, type: 'sine', volume: 0.25 },
  ],
};

type CtxCtor = new () => AudioContext;

const getCtxCtor = (): CtxCtor | undefined => {
  if (typeof window === 'undefined' && typeof globalThis.AudioContext === 'undefined') {
    return undefined;
  }
  const w = globalThis as unknown as {
    AudioContext?: CtxCtor;
    webkitAudioContext?: CtxCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
};

export const playSfx = (name: SfxName): void => {
  const Ctor = getCtxCtor();
  if (!Ctor) return;

  const ctx = new Ctor();
  const now = ctx.currentTime;
  const tones = SCRIPTS[name];
  let endTime = now;

  tones.forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, now + t.start);
    const v = t.volume ?? 0.3;
    gain.gain.setValueAtTime(0.0001, now + t.start);
    gain.gain.linearRampToValueAtTime(v, now + t.start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t.start);
    osc.stop(now + t.start + t.duration);
    endTime = Math.max(endTime, now + t.start + t.duration);
  });

  setTimeout(() => ctx.close(), Math.max(0, (endTime - now) * 1000) + 100);
};
```

Run: `npm test -- src/lib/audio.test.ts` → expected 3 passing.

- [ ] **Step 5.3: Commit**

```bash
git add -A
git commit -m "feat: add Web Audio SFX synth (bell, chime, alarm, gentle)"
```

---

## Task 6: Build the Countdown Timer widget

**Files:**
- Create: `src/widgets/Timer/index.tsx`, `src/widgets/Timer/meta.ts`, `src/widgets/Timer/Settings.tsx`, `src/widgets/Timer/Timer.test.ts`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 6.1: Pure countdown logic + tests**

Create `src/widgets/Timer/Timer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { remainingMs, parseMmss, formatMmss } from './logic';

describe('parseMmss', () => {
  it('parses MM:SS', () => {
    expect(parseMmss('05:30')).toBe(330_000);
    expect(parseMmss('00:10')).toBe(10_000);
    expect(parseMmss('99:59')).toBe(99 * 60_000 + 59_000);
  });

  it('returns null for invalid input', () => {
    expect(parseMmss('abc')).toBeNull();
    expect(parseMmss('5:99')).toBeNull();
    expect(parseMmss('')).toBeNull();
  });
});

describe('formatMmss', () => {
  it('formats milliseconds as MM:SS', () => {
    expect(formatMmss(0)).toBe('00:00');
    expect(formatMmss(60_000)).toBe('01:00');
    expect(formatMmss(330_500)).toBe('05:30');
    expect(formatMmss(-5_000)).toBe('00:00');
  });
});

describe('remainingMs', () => {
  it('returns full duration when not running', () => {
    expect(remainingMs({ running: false, durationMs: 60_000, startedAt: null }, 1_000)).toBe(60_000);
  });
  it('subtracts elapsed when running', () => {
    expect(remainingMs({ running: true, durationMs: 60_000, startedAt: 0 }, 25_000)).toBe(35_000);
  });
  it('floors at zero', () => {
    expect(remainingMs({ running: true, durationMs: 5_000, startedAt: 0 }, 999_999)).toBe(0);
  });
});
```

Run: `npm test -- src/widgets/Timer/Timer.test.ts` → expected FAIL.

- [ ] **Step 6.2: Implement the logic**

Create `src/widgets/Timer/logic.ts`:

```ts
export type TimerState = {
  running: boolean;
  durationMs: number;
  startedAt: number | null; // ms timestamp when last started
};

export const parseMmss = (s: string): number | null => {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60_000 + Number(m[2]) * 1_000;
};

export const formatMmss = (ms: number): string => {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const remainingMs = (st: TimerState, now: number): number => {
  if (!st.running || st.startedAt == null) return st.durationMs;
  const elapsed = now - st.startedAt;
  return Math.max(0, st.durationMs - elapsed);
};
```

Run: `npm test -- src/widgets/Timer/Timer.test.ts` → expected 7 passing (3 + 3 + 3 wait, let me recount: 2 parseMmss tests, 1 formatMmss with 4 expects, 3 remainingMs = around 9 — exact count depends on `it()` blocks, which is 6 `it`s).

Re-run to confirm pass count: 6 passing tests in this file (2+1+3).

- [ ] **Step 6.3: Body**

Create `src/widgets/Timer/index.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { playSfx, type SfxName } from '../../lib/audio';
import { formatMmss, remainingMs, type TimerState } from './logic';

export type TimerConfig = {
  durationMs?: number;       // configured duration
  running?: boolean;
  startedAt?: number | null; // ms timestamp
  sfx?: SfxName;
  autoReset?: boolean;
};

export default function Timer({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;

  const durationMs = cfg.durationMs ?? 5 * 60_000;
  const running = cfg.running ?? false;
  const startedAt = cfg.startedAt ?? null;
  const sfx = cfg.sfx ?? 'bell';
  const autoReset = cfg.autoReset ?? false;

  const state: TimerState = { running, durationMs, startedAt };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = remainingMs(state, now);
  const atZero = remaining <= 0;

  // Trigger SFX exactly once when crossing zero.
  const firedRef = useRef(false);
  useEffect(() => {
    if (running && atZero && !firedRef.current) {
      firedRef.current = true;
      playSfx(sfx);
      if (autoReset) {
        updateConfig(instance.id, {
          running: false,
          startedAt: null,
          durationMs: cfg.fullDurationMs ?? cfg.durationMs ?? 5 * 60_000,
        });
      } else {
        // Hold the display at 00:00 until user resets.
        updateConfig(instance.id, {
          running: false,
          startedAt: null,
          durationMs: 0,
        });
      }
    }
    if (!running || !atZero) firedRef.current = false;
  }, [running, atZero, sfx, autoReset, instance.id, updateConfig]);

  const start = () => {
    if (running) return;
    if (remaining <= 0) {
      // restart from full duration
      updateConfig(instance.id, { running: true, startedAt: Date.now() });
    } else {
      // resume — adjust startedAt so remaining holds
      updateConfig(instance.id, {
        running: true,
        startedAt: Date.now() - (durationMs - remaining),
      });
    }
  };
  const pause = () => {
    if (!running) return;
    // Bake remaining into durationMs so resume keeps the leftover.
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      durationMs: remaining,
    });
  };
  const reset = () => {
    // Reset to the *original configured* duration. We track the original
    // separately to make this work; for now, reset to a default of 5 min if
    // we've lost it. Keep the configured "fullDuration" in config too.
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      durationMs: cfg.fullDurationMs ?? cfg.durationMs ?? 5 * 60_000,
    });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2">
      <div
        className={
          'font-bold tabular-nums text-[clamp(28px,18cqw,128px)] ' +
          (atZero && running === false && remaining === 0
            ? 'text-red-500 animate-pulse'
            : '')
        }
        style={{ containerType: 'inline-size' as const }}
      >
        {formatMmss(remaining)}
      </div>
      <div className="flex gap-1">
        {!running ? (
          <button
            onClick={start}
            className="px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-sm"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-3 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

Note the `cfg.fullDurationMs` reference — we'll wire it into Settings + meta below.

- [ ] **Step 6.4: Update TimerConfig + Settings popover**

Replace `TimerConfig` in `src/widgets/Timer/index.tsx` with the version that tracks `fullDurationMs`:

In `src/widgets/Timer/index.tsx`, modify the type:

```ts
export type TimerConfig = {
  durationMs?: number;        // current remaining duration baked when paused
  fullDurationMs?: number;    // the value Reset returns to
  running?: boolean;
  startedAt?: number | null;
  sfx?: SfxName;
  autoReset?: boolean;
};
```

Create `src/widgets/Timer/Settings.tsx`:

```tsx
import { useState } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import { SFX_NAMES, playSfx, type SfxName } from '../../lib/audio';
import type { WidgetSettingsProps } from '../Demo/meta';
import { parseMmss, formatMmss } from './logic';
import type { TimerConfig } from '.';

export default function TimerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;
  const fullMs = cfg.fullDurationMs ?? 5 * 60_000;
  const [draft, setDraft] = useState(formatMmss(fullMs));
  const sfx: SfxName = cfg.sfx ?? 'bell';

  const commit = () => {
    const ms = parseMmss(draft);
    if (ms == null) {
      setDraft(formatMmss(fullMs));
      return;
    }
    updateConfig(instance.id, {
      fullDurationMs: ms,
      durationMs: ms,
      running: false,
      startedAt: null,
    });
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Timer settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span>Duration (MM:SS)</span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              className="border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Sound</span>
            <div className="flex gap-1 flex-wrap">
              {SFX_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    updateConfig(instance.id, { sfx: n });
                    playSfx(n);
                  }}
                  className={
                    'px-2 py-1 rounded text-xs ' +
                    (sfx === n ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Auto-reset on zero</span>
            <input
              type="checkbox"
              checked={cfg.autoReset ?? false}
              onChange={(e) => updateConfig(instance.id, { autoReset: e.target.checked })}
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 6.5: Metadata + register**

Create `src/widgets/Timer/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import TimerSettings from './Settings';

export const timerMeta: WidgetMeta = {
  type: 'timer',
  label: 'Timer',
  icon: '⏱️',
  defaultSize: { width: 280, height: 180 },
  defaultConfig: {
    durationMs: 5 * 60_000,
    fullDurationMs: 5 * 60_000,
    running: false,
    startedAt: null,
    sfx: 'bell',
    autoReset: false,
  },
  Settings: TimerSettings,
};
```

In `src/widgets/registry.ts`, add:

```ts
import Timer from './Timer';
import { timerMeta } from './Timer/meta';
```

```ts
  timer: { meta: timerMeta, Component: Timer },
```

- [ ] **Step 6.6: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser: click ⏱️ — timer appears with `05:00`. Click Start — counts down. Click Pause — pauses. Click Start — resumes from where you paused. Click Reset — back to `05:00`. Open settings, change duration to `00:05`, click Start — at zero you should hear the bell. Try other SFX. Toggle "Auto-reset on zero" — when timer hits zero, after the SFX plays, the duration restores to the full time (but stays paused).

- [ ] **Step 6.7: Commit**

```bash
git add -A
git commit -m "feat: add Countdown Timer widget with SFX"
```

---

## Task 7: Add IndexedDB image store + image resize utility

**Files:**
- Create: `src/overlays/Background/idb.ts`, `src/overlays/Background/idb.test.ts`, `src/overlays/Background/resize.ts`, `src/overlays/Background/resize.test.ts`

- [ ] **Step 7.1: Install idb-keyval**

```bash
npm install idb-keyval
```

- [ ] **Step 7.2: idb wrapper + tests**

Create `src/overlays/Background/idb.ts`:

```ts
import { get, set, del, createStore } from 'idb-keyval';
import { newId } from '../../lib/uuid';

const store = createStore('classroomscreen', 'images');

export const putImage = async (blob: Blob): Promise<string> => {
  const id = newId();
  await set(id, blob, store);
  return id;
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
  return await get<Blob>(id, store);
};

export const deleteImage = async (id: string): Promise<void> => {
  await del(id, store);
};
```

Create `src/overlays/Background/idb.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { putImage, getImage, deleteImage } from './idb';

describe('image idb store', () => {
  it('round-trips a blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const id = await putImage(blob);
    expect(typeof id).toBe('string');

    const back = await getImage(id);
    expect(back).toBeInstanceOf(Blob);
    const text = await back!.text();
    expect(text).toBe('hello');
  });

  it('deletes a blob', async () => {
    const blob = new Blob(['x']);
    const id = await putImage(blob);
    await deleteImage(id);
    const back = await getImage(id);
    expect(back).toBeUndefined();
  });
});
```

Install the IDB shim for Vitest:

```bash
npm install -D fake-indexeddb
```

Run: `npm test -- src/overlays/Background/idb.test.ts` → expected 2 passing.

- [ ] **Step 7.3: Image resize util + tests**

Create `src/overlays/Background/resize.ts`:

```ts
const MAX_EDGE = 2560;

export const resizeImage = async (
  file: File,
  maxEdge: number = MAX_EDGE,
): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width <= maxEdge && height <= maxEdge) {
    bitmap.close();
    return file;
  }

  const scale = maxEdge / Math.max(width, height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.9,
    );
  });
};
```

Create `src/overlays/Background/resize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resizeImage } from './resize';

// Tiny smoke test — full pixel-pipeline tests require a real browser.
describe('resizeImage', () => {
  it('returns the original file when smaller than maxEdge', async () => {
    const tiny = new File(['x'], 'tiny.txt', { type: 'image/jpeg' });
    // Mock createImageBitmap to return a small bitmap
    const close = () => {};
    (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap =
      (async () => ({ width: 100, height: 100, close })) as unknown as typeof createImageBitmap;
    const out = await resizeImage(tiny, 2000);
    expect(out).toBe(tiny);
  });
});
```

Run: `npm test -- src/overlays/Background/resize.test.ts` → expected 1 passing.

- [ ] **Step 7.4: Commit**

```bash
git add -A
git commit -m "feat: add IndexedDB image store and resize utility"
```

---

## Task 8: Build the Background overlay + Picker

**Files:**
- Create: `src/overlays/Background/index.tsx`, `src/overlays/Background/Picker.tsx`
- Modify: `src/app/App.tsx`, `src/components/Toolbar.tsx`

- [ ] **Step 8.1: Background renderer**

Create `src/overlays/Background/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { Background } from '../../store/types';
import { getImage } from './idb';

export default function BackgroundLayer({ bg }: { bg: Background }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    if (bg.kind === 'image') {
      getImage(bg.imageId).then((blob) => {
        if (revoked || !blob) return;
        url = URL.createObjectURL(blob);
        setImgUrl(url);
      });
    } else {
      setImgUrl(null);
    }
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [bg]);

  if (bg.kind === 'solid') {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
  }
  if (bg.kind === 'gradient') {
    return <div className="absolute inset-0" style={{ backgroundImage: bg.css }} />;
  }
  // image
  return (
    <div
      className="absolute inset-0 bg-slate-200"
      style={{
        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
        backgroundSize: bg.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
```

- [ ] **Step 8.2: Picker popover**

Create `src/overlays/Background/Picker.tsx`:

```tsx
import { useRef } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import { putImage, deleteImage } from './idb';
import { resizeImage } from './resize';

const SOLID_PRESETS = ['#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff', '#0f172a', '#ffffff'];
const GRADIENT_PRESETS = [
  'linear-gradient(135deg,#fbcfe8,#e0e7ff)',
  'linear-gradient(135deg,#bbf7d0,#bae6fd)',
  'linear-gradient(180deg,#fde68a,#fb7185)',
  'linear-gradient(135deg,#1e293b,#0f172a)',
];

export default function BackgroundPicker() {
  const bg = useAppStore((s) => s.current.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const id = await putImage(resized);
    // Clean up previous image, if any
    if (bg.kind === 'image') {
      try { await deleteImage(bg.imageId); } catch { /* ignore */ }
    }
    setBackground({ kind: 'image', imageId: id, fit: 'cover' });
    e.target.value = '';
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={open}
          className="h-9 px-3 rounded hover:bg-slate-100 text-sm flex items-center gap-1"
          title="Background"
        >
          🖌️ <span>Background</span>
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Solid</div>
            <div className="flex gap-2 flex-wrap">
              {SOLID_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBackground({ kind: 'solid', color: c })}
                  className="h-8 w-8 rounded border border-slate-300"
                  style={{ backgroundColor: c }}
                  aria-label={`Solid ${c}`}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Gradient</div>
            <div className="flex gap-2 flex-wrap">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g}
                  onClick={() => setBackground({ kind: 'gradient', css: g })}
                  className="h-8 w-12 rounded border border-slate-300"
                  style={{ backgroundImage: g }}
                  aria-label="Gradient preset"
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Image</div>
            <button
              onClick={() => fileInput.current?.click()}
              className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
            >
              Upload image…
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
            {bg.kind === 'image' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <label>Fit</label>
                <select
                  value={bg.fit}
                  onChange={(e) =>
                    setBackground({
                      kind: 'image',
                      imageId: bg.imageId,
                      fit: e.target.value as 'cover' | 'contain',
                    })
                  }
                  className="border border-slate-300 rounded px-1 py-0.5"
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 8.3: Add Background button to Toolbar**

Replace the contents of `src/components/Toolbar.tsx`:

```tsx
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);

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
      <div className="ml-auto relative">
        <BackgroundPicker />
      </div>
    </div>
  );
}
```

- [ ] **Step 8.4: Replace App's inline background with the BackgroundLayer**

Replace the contents of `src/app/App.tsx`:

```tsx
import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import { useAppStore } from '../store/store';

export default function App() {
  const bg = useAppStore((s) => s.current.background);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer bg={bg} />
      <WidgetCanvas />
      <Toolbar />
    </div>
  );
}
```

- [ ] **Step 8.5: Verify**

```bash
npm test && npm run build && npm run dev
```

In browser: click "🖌️ Background" — popover opens. Click solid colors and gradients — background updates live. Upload an image — it appears as the background. Refresh — background persists. (For images, the `imageId` lives in localStorage; the blob is in IndexedDB.)

- [ ] **Step 8.6: Commit**

```bash
git add -A
git commit -m "feat: add Background overlay and picker (color / gradient / image)"
```

---

## Task 9: Build the Annotate overlay

**Files:**
- Create: `src/overlays/Annotate/index.tsx`, `src/overlays/Annotate/ToolBar.tsx`
- Modify: `src/components/Toolbar.tsx`, `src/app/App.tsx`

- [ ] **Step 9.1: Canvas overlay**

Create `src/overlays/Annotate/index.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/store';
import AnnotateToolBar from './ToolBar';

type Tool = 'pen' | 'eraser';

export default function AnnotateOverlay() {
  const open = useAppStore((s) => s.annotateOpen);
  const close = useAppStore((s) => s.toggleAnnotate);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(4);

  // Resize canvas to fit viewport
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  if (!open) return null;

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current!;
    ctx.lineWidth = tool === 'eraser' ? Math.max(width * 4, 16) : width;
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  };
  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    const ctx = ctxRef.current!;
    ctx.closePath();
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  return (
    <div className="absolute inset-0 z-[200]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      />
      <AnnotateToolBar
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        width={width} setWidth={setWidth}
        onClear={clear}
        onClose={close}
      />
    </div>
  );
}
```

- [ ] **Step 9.2: Annotate toolbar**

Create `src/overlays/Annotate/ToolBar.tsx`:

```tsx
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#111827'];

type Props = {
  tool: 'pen' | 'eraser';
  setTool: (t: 'pen' | 'eraser') => void;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  onClear: () => void;
  onClose: () => void;
};

export default function AnnotateToolBar(p: Props) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-[210] bg-white/95 backdrop-blur rounded-full shadow-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
      <button
        onClick={() => p.setTool('pen')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center ' +
          (p.tool === 'pen' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
        title="Pen"
      >
        ✏️
      </button>
      <button
        onClick={() => p.setTool('eraser')}
        className={
          'h-9 w-9 rounded-full flex items-center justify-center ' +
          (p.tool === 'eraser' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
        title="Eraser"
      >
        🧽
      </button>
      <div className="w-px h-6 bg-slate-200 mx-1" />
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => {
            p.setColor(c);
            p.setTool('pen');
          }}
          className={
            'h-7 w-7 rounded-full border-2 ' +
            (p.color === c && p.tool === 'pen' ? 'border-slate-700' : 'border-transparent')
          }
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <input
        type="range"
        min={2}
        max={20}
        value={p.width}
        onChange={(e) => p.setWidth(Number(e.target.value))}
        className="w-20"
        title="Stroke width"
      />
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <button
        onClick={p.onClear}
        className="px-3 py-1 rounded hover:bg-slate-100 text-sm"
      >
        Clear
      </button>
      <button
        onClick={p.onClose}
        className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
      >
        Done
      </button>
    </div>
  );
}
```

- [ ] **Step 9.3: Add Annotate button to main toolbar + render overlay in App**

Edit `src/components/Toolbar.tsx`. After the widget icons block and before the Background picker, add an Annotate button. Replace the file:

```tsx
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';

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
      <div className="ml-auto relative">
        <BackgroundPicker />
      </div>
    </div>
  );
}
```

Edit `src/app/App.tsx` to render the overlay:

```tsx
import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import AnnotateOverlay from '../overlays/Annotate';
import { useAppStore } from '../store/store';

export default function App() {
  const bg = useAppStore((s) => s.current.background);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer bg={bg} />
      <WidgetCanvas />
      <Toolbar />
      <AnnotateOverlay />
    </div>
  );
}
```

- [ ] **Step 9.4: Verify**

```bash
npm run build && npm run dev
```

In browser: click "✏️ Annotate" — full-screen canvas with a floating toolbar at the bottom. Draw with the mouse — pen leaves strokes. Switch to eraser — erases. Switch colors — pen adopts new color. Drag the width slider — strokes become thicker. Clear — all strokes gone. Click Done — overlay closes; widgets are interactive again.

- [ ] **Step 9.5: Commit**

```bash
git add -A
git commit -m "feat: add Annotate overlay (pen, eraser, colors, width, clear)"
```

---

## Task 10: Push to GitHub and verify the live deploy

- [ ] **Step 10.1: Push**

```bash
git push
```

- [ ] **Step 10.2: Watch the workflow**

```bash
gh run watch --exit-status
```

Expected: build + deploy succeed.

- [ ] **Step 10.3: Verify live**

Open `https://kiwispin.github.io/ClassroomScreen/` — all five Tier-1 widgets work as in dev.

---

## Phase 2 done — verification checklist

- [ ] `npm test` passes (added: 3 store actions tests, 3 audio tests, 6 timer logic tests, 2 idb tests, 1 resize test).
- [ ] Toolbar shows: 🧪 Demo, 📝 Notepad, ⏰ Clock, ⏱️ Timer, ✏️ Annotate, (right side) 🖌️ Background.
- [ ] Notepad: click ⚙ → font size slider works. Text persists across refresh.
- [ ] Clock: click ⚙ → toggles for 24-hour, seconds, date all work.
- [ ] Timer: settings allow MM:SS input, SFX choice, auto-reset toggle. Start/Pause/Reset work. Audio plays at zero.
- [ ] Background: solid + gradient presets switch live. Image upload appears as background and persists across refresh.
- [ ] Annotate: full-screen canvas. Pen, eraser, 5 colors, stroke width, clear, and Done all work.
- [ ] Live GitHub Pages URL behaves identically.

When all boxes are ticked, Phase 2 is done. Move on to Phase 3 (persistence + presets) by writing a new plan.
