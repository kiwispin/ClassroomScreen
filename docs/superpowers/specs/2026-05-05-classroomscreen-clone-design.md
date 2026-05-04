# ClassroomScreen Clone — Design

**Date:** 2026-05-05
**Status:** Approved (pending user spec review)

## Overview

A personal-use, free-form classroom dashboard that functionally clones [classroomscreen.com](https://classroomscreen.com). Hosted as a static site on GitHub Pages, runs entirely in the browser, no backend.

The goal is feature parity with ClassroomScreen's free + paid tiers (most importantly, multiple saved presets — a paid feature on the original) without paying for the original.

## Scope

**In scope:**
- All 16 widgets used by the original (see Widget Catalog).
- Free-form draggable, resizable widget tiles.
- Background customization (solid color, gradient, uploaded image).
- Annotate overlay (full-screen drawing layer).
- Multiple named presets (save/load/rename/delete).
- State auto-persists across browser sessions on the same device.
- Static-site deploy via GitHub Pages.

**Out of scope:**
- Accounts, auth, billing, multi-user.
- Backend, server, or database.
- Automatic cross-device sync. (Per-device localStorage is fine to start; export/import deferred until needed.)
- Mobile-first design — primary target is a classroom display (1080p+ projector or laptop).

## Success Criteria

1. Opening the URL restores the last working state automatically.
2. User can switch between named presets in one click.
3. Tier-1 widgets (background, clock, countdown timer with SFX, notepad, annotate) feel as polished as the original.
4. All other listed widgets exist and work, even if minimally styled.
5. Site deploys to GitHub Pages on every push to `main`.

## Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Largest ecosystem for the kinds of components we need. |
| Build / dev server | Vite | Fast, minimal config, outputs static files. |
| Styling | Tailwind CSS | Rapid iteration, no separate stylesheet bookkeeping. |
| Global state | Zustand + `persist` middleware | Lightweight, built-in localStorage persistence. |
| Drag / resize | `react-rnd` | Battle-tested, handles drag handles + resize handles + bounds. |
| Image storage | `idb-keyval` (IndexedDB) | localStorage's ~5 MB cap is too tight for background images. |
| QR rendering | `qrcode.react` | Simple, well-maintained. |
| Tests | Vitest + React Testing Library | Logic-heavy widgets only (timer math, RNG, name picker, persistence migrations). |
| Deploy | GitHub Action → `gh-pages` branch | Zero-touch deploy on push to `main`. |

## Architecture

### Three-layer screen

Back to front:

1. **Background layer** — fills the viewport. Solid color, linear gradient, or uploaded image (object-fit: cover).
2. **Widget layer** — independently draggable, resizable tiles via `react-rnd`. Each widget is an isolated component with its own internal state (e.g., timer running/paused) plus persisted config in the global store.
3. **Overlay layer** — annotate canvas. Toggled on/off. When on, full-screen transparent canvas; widgets remain visible underneath but pointer events go to the canvas.

### Toolbar

Fixed strip along the top edge of the viewport.

- Widget icons. Clicking a widget icon always adds a new instance to the screen; removal happens via the close button on the widget's tile header. (Background and Annotate are exceptions — they are screen-wide layers, not tiles, and toggle on/off.)
- Background button → opens background picker popover (color / gradient / image upload).
- Annotate button → toggles the drawing overlay.
- Presets dropdown → list saved presets, "Save current as preset…", "Manage presets".
- Fullscreen toggle.
- Auto-hides after a few seconds of mouse inactivity to keep the classroom display clean. Reappears on mouse-to-top-edge.

### Widget tile chrome

Thin header with widget name, gear (settings popover), and close button. Hidden by default, fades in on hover. Keeps the screen clean during lessons.

### Per-widget settings

Inline popover anchored to the gear icon. Avoids context-switching to a modal.

### Repo layout

```
src/
  app/              # App shell, layout, routing
  store/            # Zustand store + persistence middleware
  widgets/
    registry.ts     # widget type → component + metadata + default config
    Clock/
    Timer/
    Stopwatch/
    NamePicker/
    Dice/
    TrafficLight/
    WorkSymbols/
    QRCode/
    Notepad/
    ImageEmbed/
    VideoEmbed/
    ExitPoll/
    Calendar/
    NoiseMeter/
  overlays/
    Annotate/       # Full-screen drawing canvas
    Background/     # Background layer + picker
  components/       # Toolbar, PresetMenu, ConfirmDialog, etc.
  lib/              # Utilities (image resize, audio, idb wrapper, uuid)
  assets/sounds/    # Bundled timer SFX (bell, chime, alarm, gentle)
public/
```

## Data Model

```ts
type WidgetType =
  | 'clock' | 'timer' | 'stopwatch' | 'namepicker' | 'dice'
  | 'trafficlight' | 'worksymbols' | 'qrcode' | 'notepad'
  | 'image' | 'video' | 'poll' | 'calendar' | 'noisemeter';

type WidgetInstance = {
  id: string;           // uuid v4
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  config: Record<string, unknown>;  // per-widget settings
};

type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; css: string }
  | { kind: 'image'; imageId: string; fit: 'cover' | 'contain' };

type ScreenState = {
  widgets: WidgetInstance[];
  background: Background;
};

type Preset = {
  id: string;
  name: string;
  state: ScreenState;
  createdAt: number;
  updatedAt: number;
};

type AppState = {
  schemaVersion: number;       // for migrations
  current: ScreenState;        // always live, autosaved
  presets: Preset[];
  activePresetId: string | null;  // null = unsaved working state
  annotateOpen: boolean;
  toolbarPinned: boolean;
};
```

## Persistence

- **localStorage** (via Zustand `persist`): the entire `AppState` *except* image binaries.
- **IndexedDB** (`idb-keyval`): uploaded image blobs keyed by `imageId`. `Background` only stores the id.
- On app load, hydrate the Zustand store first, then any background image is resolved from IDB and rendered.
- `schemaVersion` is included so future versions can migrate stored data without crashing.
- Image uploads are downscaled to a max edge of 2560px and re-encoded to JPEG (or kept as PNG if transparent) before being stored, keeping IDB usage reasonable.

## Preset Behavior

- Switching to a preset replaces `current` with a deep copy of the preset's `state`. Editing widgets afterwards modifies `current` only — the preset is not mutated until the user explicitly "Update preset".
- "Save as new preset" prompts for a name.
- Deleting the active preset clears `activePresetId` but leaves `current` intact.

## Widget Catalog

### Tier 1 — polish from day one

| Widget | Behavior |
|---|---|
| Background | Solid color / linear gradient / uploaded image (auto-resized, stored in IndexedDB). Image fit defaults to cover. |
| Clock | Digital + optional analog. 12/24 h toggle. Optional seconds. Optional date line. |
| Countdown Timer | Set MM:SS via input or +/- buttons. Start / pause / reset. SFX picker (bundled: bell, chime, alarm, gentle). Visual flash at zero. Optional auto-reset. |
| Notepad | Plain text area. Font size adjustable. Live-edits, autosaved to widget config. |
| Annotate | Full-screen canvas overlay. Pen + eraser, 5 colors, stroke width slider. Clear button. Drawings discarded when overlay closes. |

### Tier 2 — functional first, polish later

| Widget | Behavior |
|---|---|
| Stopwatch | Counts up. Start / pause / reset. No laps. |
| Random Name Picker | Paste/edit a list of names. Click "Pick" → animated reveal of one name. Option to remove the picked name from the pool. |
| Dice / Random Number | Roll 1–6 dice (1–4 dice at a time) or pick a number in a custom min/max range. |
| Traffic Light | Three buttons; clicking sets the active light. |
| Work Symbols | 4–6 icons (silent / whisper / partner / group); click to highlight one. |
| QR Code | URL input → renders QR. |
| Image Embed | Upload or paste URL → displays inside the widget tile. |
| Calendar / Date | Day-of-week + date, optional mini-month view. |

### Tier 3 — last

| Widget | Behavior |
|---|---|
| Noise Meter | Mic input → animated bar. Adjustable threshold + visual warning. Graceful permission denial. |
| Video Embed | YouTube URL → renders embed iframe. URL paste field in settings. |
| Exit Poll | Three vote buttons (👍 / 😐 / 👎) with running tallies. Reset button. |

## Build Order

1. **Foundation** — Vite + React + TS + Tailwind scaffold. Zustand store. Widget registry. App shell with toolbar + draggable tile container. GitHub Action for gh-pages deploy.
2. **Tier 1 widgets** — Background, Clock, Countdown Timer (with bundled SFX), Notepad, Annotate overlay.
3. **Persistence & presets** — Zustand persist + IndexedDB image store. Preset save / load / rename / delete UI.
4. **Tier 2 widgets** — Stopwatch, Name Picker, Dice, Traffic Light, Work Symbols, QR, Image, Calendar.
5. **Tier 3 widgets** — Noise Meter, Video Embed, Exit Poll.
6. **Polish** — Auto-hiding toolbar, fullscreen mode, keyboard shortcuts, visual style pass, real-classroom-display test.

## Testing

Vitest unit tests for logic-heavy modules:

- Timer countdown math and zero-crossing trigger.
- Name picker shuffle (deterministic with seeded RNG).
- Dice / random number range correctness.
- Persistence migrations (when `schemaVersion` ever bumps).

No component snapshot tests. UI is verified manually in the browser during development.

## Error Handling

This is a single-user, single-device app, so error handling is intentionally light:

- Microphone permission denial in Noise Meter → show a friendly inline message and a retry button.
- Image upload too large or wrong type → inline error in the picker.
- IndexedDB write failure (quota) → toast, image not saved, fallback to no image.
- localStorage corruption / version mismatch → fall back to default state, log to console.

## Deferred / Future

- Export / import presets as JSON (for cross-device sync without a backend).
- More background gradient presets / library of stock images.
- Per-period scheduling (presets that auto-load by time or day).
- Keyboard shortcuts beyond the basic ones in the polish phase.
