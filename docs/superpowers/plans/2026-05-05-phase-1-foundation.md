# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Vite + React + TS + Tailwind project, the Zustand store with localStorage persistence, the widget registry pattern, an app shell with a toolbar and draggable widget tile area, and a working GitHub Pages deploy. By end of Phase 1, you can add a single placeholder "Demo" widget to the screen, drag it around, resize it, close it, refresh the browser and see it persisted, and visit a live GitHub Pages URL that shows the same.

**Architecture:** A single-page React app. Global state in Zustand, persisted to localStorage. Widget instances live in the store as plain data; a registry maps widget `type` → component. The `WidgetCanvas` reads instances from the store and renders each via `react-rnd`. Static build deploys to `gh-pages` on every push to `main`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, react-rnd, uuid, Vitest, @testing-library/react, GitHub Actions.

---

## File Structure

After Phase 1 completes, the repo will look like:

```
.github/workflows/deploy.yml      # GitHub Pages deploy
.gitignore
docs/superpowers/                 # specs + plans (already exists)
index.html                        # Vite entry
package.json
postcss.config.js
tailwind.config.js
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
src/
  main.tsx                        # React mount
  index.css                       # Tailwind directives + global resets
  app/
    App.tsx                       # Top-level shell
  store/
    types.ts                      # Shared TS types
    store.ts                      # Zustand store + persist + actions
    store.test.ts                 # Store unit tests
  widgets/
    registry.ts                   # widget type → metadata + component
    registry.test.ts              # Registry unit tests
    Demo/
      index.tsx                   # Placeholder widget body
      meta.ts                     # Registry metadata
  components/
    Toolbar.tsx                   # Top toolbar
    WidgetCanvas.tsx              # Draggable/resizable tile container
    WidgetTile.tsx                # Per-tile chrome (header, close)
  lib/
    uuid.ts                       # uuid wrapper for testability
```

---

## Task 1: Initialize the Vite project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/index.css`

- [ ] **Step 1.1: Scaffold Vite + React + TS**

Run from the repo root:

```bash
npm create vite@latest . -- --template react-ts
```

If prompted "Current directory is not empty. Please choose how to proceed: › Remove existing files and continue / Cancel operation / Ignore files and continue", select **Ignore files and continue**.

Expected: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/...` are created.

- [ ] **Step 1.2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 1.3: Smoke-test the dev server**

```bash
npm run dev
```

Expected: prints `VITE v5.x ready in Nms` and a local URL like `http://localhost:5173/`. Open the URL in a browser and confirm the default Vite + React page renders. Stop the server with Ctrl+C.

- [ ] **Step 1.4: Strip the default Vite boilerplate**

Do these in order so intermediate states still build:

1. Move `App.tsx` into a new `app/` folder:

   ```bash
   mkdir -p src/app
   mv src/App.tsx src/app/App.tsx
   ```

2. Replace the contents of `src/app/App.tsx`:

   ```tsx
   export default function App() {
     return <div className="app-root">ClassroomScreen — bootstrapping…</div>;
   }
   ```

3. Replace the contents of `src/index.css` with a placeholder (Tailwind goes here in Task 2):

   ```css
   /* Tailwind directives go here in Task 2 */
   ```

4. Replace the contents of `src/main.tsx`:

   ```tsx
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import './index.css';
   import App from './app/App';

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <App />
     </StrictMode>,
   );
   ```

5. Remove the now-unused asset files. The bundled SVGs were only referenced by the deleted boilerplate:

   ```bash
   rm src/App.css src/assets/react.svg
   ```

6. Remove the favicon link from `index.html` (since we deleted nothing in `public/` we'll leave `vite.svg` alone for now — but if you prefer to drop it, also delete `public/vite.svg` AND remove the `<link rel="icon" ...>` line from `index.html`).

- [ ] **Step 1.5: Verify it still runs**

```bash
npm run dev
```

Expected: page shows the text "ClassroomScreen — bootstrapping…". Stop the server.

- [ ] **Step 1.6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project"
```

---

## Task 2: Add Tailwind CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`, `src/app/App.tsx`

- [ ] **Step 2.1: Install Tailwind**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 2.2: Configure content globs**

Replace the contents of `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 2.3: Add Tailwind directives**

Replace the contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 2.4: Verify Tailwind utilities work**

Edit `src/app/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-700">
      ClassroomScreen — bootstrapping…
    </div>
  );
}
```

Run:

```bash
npm run dev
```

Expected: page background is light gray (`bg-slate-100`), text is centered. Stop the server.

- [ ] **Step 2.5: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS"
```

---

## Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 3.1: Install Vitest and Testing Library**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3.2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3.3: Create the test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3.4: Add test scripts**

Edit `package.json` `"scripts"` block to add a `test` and `test:watch` script:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3.5: Add a smoke test to verify the setup**

Create `src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 3.6: Commit**

```bash
git add -A
git commit -m "feat: configure Vitest"
```

---

## Task 4: Define shared TypeScript types

**Files:**
- Create: `src/store/types.ts`

- [ ] **Step 4.1: Write the types file**

Create `src/store/types.ts`:

```ts
export type WidgetType =
  | 'demo'
  | 'clock'
  | 'timer'
  | 'stopwatch'
  | 'namepicker'
  | 'dice'
  | 'trafficlight'
  | 'worksymbols'
  | 'qrcode'
  | 'notepad'
  | 'image'
  | 'video'
  | 'poll'
  | 'calendar'
  | 'noisemeter';

export type WidgetInstance = {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  config: Record<string, unknown>;
};

export type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; css: string }
  | { kind: 'image'; imageId: string; fit: 'cover' | 'contain' };

export type ScreenState = {
  widgets: WidgetInstance[];
  background: Background;
};

export type Preset = {
  id: string;
  name: string;
  state: ScreenState;
  createdAt: number;
  updatedAt: number;
};

export type AppState = {
  schemaVersion: number;
  current: ScreenState;
  presets: Preset[];
  activePresetId: string | null;
  annotateOpen: boolean;
  toolbarPinned: boolean;
};

export const DEFAULT_BACKGROUND: Background = {
  kind: 'solid',
  color: '#dbeafe', // tailwind blue-100
};

export const DEFAULT_SCREEN: ScreenState = {
  widgets: [],
  background: DEFAULT_BACKGROUND,
};

export const SCHEMA_VERSION = 1;
```

- [ ] **Step 4.2: Commit**

```bash
git add -A
git commit -m "feat: add shared store types"
```

---

## Task 5: Create the uuid wrapper

**Files:**
- Create: `src/lib/uuid.ts`, `src/lib/uuid.test.ts`

- [ ] **Step 5.1: Install uuid**

```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 5.2: Write the failing test**

Create `src/lib/uuid.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { newId } from './uuid';

describe('newId', () => {
  it('returns a non-empty string', () => {
    const id = newId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values across calls', () => {
    const a = newId();
    const b = newId();
    expect(a).not.toBe(b);
  });
});
```

Run:

```bash
npm test -- src/lib/uuid.test.ts
```

Expected: FAIL — `Cannot find module './uuid'`.

- [ ] **Step 5.3: Implement**

Create `src/lib/uuid.ts`:

```ts
import { v4 } from 'uuid';

export const newId = (): string => v4();
```

Run:

```bash
npm test -- src/lib/uuid.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5.4: Commit**

```bash
git add -A
git commit -m "feat: add uuid wrapper"
```

---

## Task 6: Build the Zustand store with actions (TDD)

**Files:**
- Create: `src/store/store.ts`, `src/store/store.test.ts`

- [ ] **Step 6.1: Install Zustand**

```bash
npm install zustand
```

- [ ] **Step 6.2: Write failing tests for the store actions**

Create `src/store/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';
import { DEFAULT_SCREEN } from './types';

const reset = () =>
  useAppStore.setState({
    schemaVersion: 1,
    current: { ...DEFAULT_SCREEN, widgets: [] },
    presets: [],
    activePresetId: null,
    annotateOpen: false,
    toolbarPinned: false,
  });

describe('app store', () => {
  beforeEach(reset);

  it('starts with the default screen and no widgets', () => {
    const s = useAppStore.getState();
    expect(s.current.widgets).toEqual([]);
    expect(s.current.background).toEqual(DEFAULT_SCREEN.background);
  });

  it('addWidget appends a new instance with a generated id', () => {
    useAppStore.getState().addWidget('demo');
    const s = useAppStore.getState();
    expect(s.current.widgets).toHaveLength(1);
    expect(s.current.widgets[0].type).toBe('demo');
    expect(typeof s.current.widgets[0].id).toBe('string');
    expect(s.current.widgets[0].id.length).toBeGreaterThan(0);
  });

  it('addWidget assigns increasing zIndex', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().addWidget('demo');
    const ws = useAppStore.getState().current.widgets;
    expect(ws[1].zIndex).toBeGreaterThan(ws[0].zIndex);
  });

  it('removeWidget removes by id', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().removeWidget(id);
    expect(useAppStore.getState().current.widgets).toHaveLength(0);
  });

  it('updateWidgetPosition writes new x/y', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetPosition(id, 42, 99);
    const w = useAppStore.getState().current.widgets[0];
    expect(w.position).toEqual({ x: 42, y: 99 });
  });

  it('updateWidgetSize writes new width/height', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetSize(id, 300, 200);
    const w = useAppStore.getState().current.widgets[0];
    expect(w.size).toEqual({ width: 300, height: 200 });
  });

  it('focusWidget raises its zIndex above all others', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().addWidget('demo');
    const [a, b] = useAppStore.getState().current.widgets;
    useAppStore.getState().focusWidget(a.id);
    const updated = useAppStore.getState().current.widgets;
    const aZ = updated.find((w) => w.id === a.id)!.zIndex;
    const bZ = updated.find((w) => w.id === b.id)!.zIndex;
    expect(aZ).toBeGreaterThan(bZ);
  });
});
```

Run:

```bash
npm test -- src/store/store.test.ts
```

Expected: FAIL — `Cannot find module './store'`.

- [ ] **Step 6.3: Implement the store**

Create `src/store/store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  DEFAULT_SCREEN,
  SCHEMA_VERSION,
  WidgetType,
} from './types';
import { newId } from '../lib/uuid';

type Actions = {
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, width: number, height: number) => void;
  focusWidget: (id: string) => void;
};

const initialState: AppState = {
  schemaVersion: SCHEMA_VERSION,
  current: DEFAULT_SCREEN,
  presets: [],
  activePresetId: null,
  annotateOpen: false,
  toolbarPinned: false,
};

const nextZIndex = (widgets: { zIndex: number }[]): number =>
  widgets.length === 0 ? 1 : Math.max(...widgets.map((w) => w.zIndex)) + 1;

export const useAppStore = create<AppState & Actions>()(
  persist(
    (set) => ({
      ...initialState,

      addWidget: (type) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: [
              ...s.current.widgets,
              {
                id: newId(),
                type,
                position: { x: 80, y: 80 },
                size: { width: 240, height: 160 },
                zIndex: nextZIndex(s.current.widgets),
                config: {},
              },
            ],
          },
        })),

      removeWidget: (id) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.filter((w) => w.id !== id),
          },
        })),

      updateWidgetPosition: (id, x, y) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, position: { x, y } } : w,
            ),
          },
        })),

      updateWidgetSize: (id, width, height) =>
        set((s) => ({
          current: {
            ...s.current,
            widgets: s.current.widgets.map((w) =>
              w.id === id ? { ...w, size: { width, height } } : w,
            ),
          },
        })),

      focusWidget: (id) =>
        set((s) => {
          const top = nextZIndex(s.current.widgets);
          return {
            current: {
              ...s.current,
              widgets: s.current.widgets.map((w) =>
                w.id === id ? { ...w, zIndex: top } : w,
              ),
            },
          };
        }),
    }),
    {
      name: 'classroomscreen-state',
      version: SCHEMA_VERSION,
    },
  ),
);
```

Run:

```bash
npm test -- src/store/store.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 6.4: Commit**

```bash
git add -A
git commit -m "feat: add Zustand store with widget CRUD actions"
```

---

## Task 7: Build the widget registry

**Files:**
- Create: `src/widgets/registry.ts`, `src/widgets/registry.test.ts`, `src/widgets/Demo/index.tsx`, `src/widgets/Demo/meta.ts`

- [ ] **Step 7.1: Create the Demo widget body**

Create `src/widgets/Demo/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';

export default function DemoWidget({ instance }: { instance: WidgetInstance }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white text-slate-600 text-sm">
      Demo widget · {instance.id.slice(0, 6)}
    </div>
  );
}
```

- [ ] **Step 7.2: Create the Demo metadata**

Create `src/widgets/Demo/meta.ts`:

```ts
import type { WidgetType } from '../../store/types';

export type WidgetMeta = {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
};

export const demoMeta: WidgetMeta = {
  type: 'demo',
  label: 'Demo',
  icon: '🧪',
  defaultSize: { width: 240, height: 160 },
  defaultConfig: {},
};
```

- [ ] **Step 7.3: Write the failing registry tests**

Create `src/widgets/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getWidgetMeta, getWidgetComponent, allWidgets } from './registry';

describe('widget registry', () => {
  it('lists at least one widget', () => {
    expect(allWidgets.length).toBeGreaterThan(0);
  });

  it('returns metadata for the demo widget', () => {
    const meta = getWidgetMeta('demo');
    expect(meta).toBeDefined();
    expect(meta?.type).toBe('demo');
    expect(meta?.label).toBe('Demo');
  });

  it('returns a component for the demo widget', () => {
    const C = getWidgetComponent('demo');
    expect(typeof C).toBe('function');
  });

  it('returns undefined for an unknown widget type', () => {
    // @ts-expect-error - intentionally invalid for test
    expect(getWidgetMeta('does-not-exist')).toBeUndefined();
  });
});
```

Run:

```bash
npm test -- src/widgets/registry.test.ts
```

Expected: FAIL — `Cannot find module './registry'`.

- [ ] **Step 7.4: Implement the registry**

Create `src/widgets/registry.ts`:

```ts
import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../store/types';
import DemoWidget from './Demo';
import { demoMeta, type WidgetMeta } from './Demo/meta';

export type WidgetProps = { instance: WidgetInstance };

type Entry = {
  meta: WidgetMeta;
  Component: ComponentType<WidgetProps>;
};

const registry: Partial<Record<WidgetType, Entry>> = {
  demo: { meta: demoMeta, Component: DemoWidget },
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

Run:

```bash
npm test -- src/widgets/registry.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 7.5: Commit**

```bash
git add -A
git commit -m "feat: add widget registry with Demo widget"
```

---

## Task 8: Build the Toolbar

**Files:**
- Create: `src/components/Toolbar.tsx`

- [ ] **Step 8.1: Implement the toolbar**

Create `src/components/Toolbar.tsx`:

```tsx
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';

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
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add -A
git commit -m "feat: add Toolbar component"
```

---

## Task 9: Build WidgetTile and WidgetCanvas with react-rnd

**Files:**
- Create: `src/components/WidgetTile.tsx`, `src/components/WidgetCanvas.tsx`

- [ ] **Step 9.1: Install react-rnd**

```bash
npm install react-rnd
```

- [ ] **Step 9.2: Implement the tile chrome**

Create `src/components/WidgetTile.tsx`:

```tsx
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

  return (
    <div className="h-full w-full flex flex-col rounded-lg shadow bg-white overflow-hidden group">
      <div className="h-7 px-2 flex items-center justify-between bg-slate-50 text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move">
        <span>{meta.label}</span>
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
      <div className="flex-1 min-h-0">
        <Component instance={instance} />
      </div>
    </div>
  );
}
```

- [ ] **Step 9.3: Implement the canvas**

Create `src/components/WidgetCanvas.tsx`:

```tsx
import { Rnd } from 'react-rnd';
import { useAppStore } from '../store/store';
import WidgetTile from './WidgetTile';

export default function WidgetCanvas() {
  const widgets = useAppStore((s) => s.current.widgets);
  const updatePos = useAppStore((s) => s.updateWidgetPosition);
  const updateSize = useAppStore((s) => s.updateWidgetSize);
  const focusWidget = useAppStore((s) => s.focusWidget);

  return (
    <div className="absolute inset-0 pt-12">
      {widgets.map((w) => (
        <Rnd
          key={w.id}
          position={{ x: w.position.x, y: w.position.y }}
          size={{ width: w.size.width, height: w.size.height }}
          dragHandleClassName="drag-handle"
          bounds="parent"
          minWidth={120}
          minHeight={80}
          style={{ zIndex: w.zIndex }}
          onDragStart={() => focusWidget(w.id)}
          onDragStop={(_e, d) => updatePos(w.id, d.x, d.y)}
          onResizeStop={(_e, _dir, ref, _delta, pos) => {
            updateSize(w.id, ref.offsetWidth, ref.offsetHeight);
            updatePos(w.id, pos.x, pos.y);
          }}
        >
          <WidgetTile instance={w} />
        </Rnd>
      ))}
    </div>
  );
}
```

- [ ] **Step 9.4: Commit**

```bash
git add -A
git commit -m "feat: add WidgetCanvas and WidgetTile with react-rnd"
```

---

## Task 10: Wire it all into the App shell

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 10.1: Wire up the shell**

Replace the contents of `src/app/App.tsx`:

```tsx
import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import { useAppStore } from '../store/store';

export default function App() {
  const bg = useAppStore((s) => s.current.background);

  const backgroundStyle =
    bg.kind === 'solid'
      ? { backgroundColor: bg.color }
      : bg.kind === 'gradient'
        ? { backgroundImage: bg.css }
        : {};

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={backgroundStyle}
    >
      <WidgetCanvas />
      <Toolbar />
    </div>
  );
}
```

- [ ] **Step 10.2: Smoke-test in the browser**

```bash
npm run dev
```

Open the URL.

Expected:
1. Light blue background fills the viewport.
2. Toolbar at the top with a single 🧪 Demo button.
3. Click the button — a widget tile appears in the top-left of the screen below the toolbar.
4. Hover the tile — the header bar fades in showing "Demo" and `×`.
5. Drag the header — the tile moves.
6. Drag the bottom-right corner — the tile resizes.
7. Click `×` — the tile disappears.
8. Add 2 tiles, drag one onto the other — the dragged tile comes to the front.
9. Refresh the page — your last set of tiles and their positions persist.

Stop the server.

- [ ] **Step 10.3: Commit**

```bash
git add -A
git commit -m "feat: wire toolbar + canvas into App shell"
```

---

## Task 11: Configure Vite for GitHub Pages

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 11.1: Create the GitHub repo (manual step)**

If you haven't already, create an empty GitHub repo named `ClassroomScreen` (no README, no .gitignore — we already have local commits). Set the remote:

```bash
git remote add origin https://github.com/<your-username>/ClassroomScreen.git
git branch -M main
```

Replace `<your-username>` with your GitHub username.

- [ ] **Step 11.2: Set the Vite base path**

GitHub Pages serves the site from `https://<user>.github.io/ClassroomScreen/`, so Vite needs to know to prefix asset paths with `/ClassroomScreen/`.

Replace the contents of `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ClassroomScreen/',
});
```

- [ ] **Step 11.3: Verify the production build still works locally**

```bash
npm run build
npm run preview
```

Open the URL `vite preview` prints. Note: because of the base path, you'll need to visit it under `/ClassroomScreen/` — the `preview` command prints the full URL.

Expected: page loads, demo widget add/drag/resize/refresh-persist all still work.

Stop the preview server.

- [ ] **Step 11.4: Commit**

```bash
git add -A
git commit -m "feat: set Vite base path for GitHub Pages"
```

---

## Task 12: Add the GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 12.1: Write the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 12.2: Push to GitHub**

```bash
git add -A
git commit -m "ci: add GitHub Pages deploy workflow"
git push -u origin main
```

- [ ] **Step 12.3: Enable GitHub Pages (manual step)**

In the GitHub UI: **Repo → Settings → Pages → Build and deployment → Source: GitHub Actions**.

- [ ] **Step 12.4: Watch the workflow run**

```bash
gh run watch
```

(Or in the GitHub UI: **Repo → Actions**.)

Expected: `build` and `deploy` jobs both succeed. The deploy step prints a URL like `https://<user>.github.io/ClassroomScreen/`.

- [ ] **Step 12.5: Open the live site and verify**

Open the URL. Expected: same behavior as `npm run dev` — toolbar, demo widget add/drag/resize/persist all work.

---

## Phase 1 done — verification checklist

Before declaring Phase 1 complete, confirm all of these:

- [ ] `npm test` passes (smoke + uuid + store + registry tests).
- [ ] `npm run dev` shows the app with toolbar + light blue background.
- [ ] Clicking the 🧪 Demo button adds a widget tile.
- [ ] Tiles drag from the (hover-revealed) header.
- [ ] Tiles resize from the bottom-right corner.
- [ ] Clicking `×` on a tile removes it.
- [ ] Refreshing the browser restores the same tiles in the same positions.
- [ ] `npm run build && npm run preview` works.
- [ ] GitHub Action build + deploy succeeds.
- [ ] Live GitHub Pages URL behaves the same as local.

When all boxes are ticked, Phase 1 is done. Move on to Phase 2 (Tier 1 widgets) by writing a new plan.
