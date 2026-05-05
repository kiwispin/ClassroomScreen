# Phase 4 — Tier 2 Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the eight remaining "Tier 2" widgets so the toolbar is fully populated: Stopwatch, Random Name Picker, Dice / Random Number, Traffic Light, Work Symbols, QR Code, Image Embed, Calendar / Date.

**Architecture:** Same pattern as Phase 2 — each widget is a folder under `src/widgets/` with an `index.tsx` body, a `meta.ts`, an optional `Settings.tsx`, and an entry in the registry. Image Embed reuses the IndexedDB image store from `overlays/Background/idb.ts`. QR Code uses `qrcode.react`.

**Tech Stack additions:** `qrcode.react`.

---

## File Structure

```
src/widgets/
  Stopwatch/        index.tsx, meta.ts, logic.ts, logic.test.ts
  NamePicker/       index.tsx, meta.ts, Settings.tsx, logic.ts, logic.test.ts
  Dice/             index.tsx, meta.ts, Settings.tsx, logic.ts, logic.test.ts
  TrafficLight/     index.tsx, meta.ts
  WorkSymbols/      index.tsx, meta.ts
  QRCode/           index.tsx, meta.ts, Settings.tsx
  ImageEmbed/       index.tsx, meta.ts, Settings.tsx
  Calendar/         index.tsx, meta.ts, Settings.tsx
src/widgets/registry.ts (extended)
```

---

## Task 1: Stopwatch

**Files:**
- Create: `src/widgets/Stopwatch/{index.tsx,meta.ts,logic.ts,logic.test.ts}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 1.1: Logic + tests**

Create `src/widgets/Stopwatch/logic.ts`:

```ts
export type StopwatchState = {
  running: boolean;
  startedAt: number | null;     // ms timestamp when running started
  accumulatedMs: number;        // ms from previous run segments
};

export const elapsedMs = (st: StopwatchState, now: number): number => {
  if (!st.running || st.startedAt == null) return st.accumulatedMs;
  return st.accumulatedMs + Math.max(0, now - st.startedAt);
};

export const formatStopwatch = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
```

Create `src/widgets/Stopwatch/logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { elapsedMs, formatStopwatch } from './logic';

describe('elapsedMs', () => {
  it('returns accumulated when paused', () => {
    expect(elapsedMs({ running: false, startedAt: null, accumulatedMs: 5000 }, 999)).toBe(5000);
  });
  it('adds (now - startedAt) when running', () => {
    expect(elapsedMs({ running: true, startedAt: 100, accumulatedMs: 5000 }, 600)).toBe(5500);
  });
});

describe('formatStopwatch', () => {
  it('MM:SS under an hour', () => {
    expect(formatStopwatch(0)).toBe('00:00');
    expect(formatStopwatch(125_000)).toBe('02:05');
  });
  it('HH:MM:SS at and over one hour', () => {
    expect(formatStopwatch(3600_000)).toBe('01:00:00');
    expect(formatStopwatch(3725_000)).toBe('01:02:05');
  });
});
```

Run: `npm test -- src/widgets/Stopwatch/logic.test.ts` → expected 4 passing.

- [ ] **Step 1.2: Body**

Create `src/widgets/Stopwatch/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { elapsedMs, formatStopwatch, type StopwatchState } from './logic';

export type StopwatchConfig = {
  running?: boolean;
  startedAt?: number | null;
  accumulatedMs?: number;
};

export default function Stopwatch({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as StopwatchConfig;
  const state: StopwatchState = {
    running: cfg.running ?? false,
    startedAt: cfg.startedAt ?? null,
    accumulatedMs: cfg.accumulatedMs ?? 0,
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [state.running]);

  const elapsed = elapsedMs(state, now);

  const start = () => {
    if (state.running) return;
    updateConfig(instance.id, { running: true, startedAt: Date.now() });
  };
  const pause = () => {
    if (!state.running) return;
    updateConfig(instance.id, {
      running: false,
      startedAt: null,
      accumulatedMs: elapsed,
    });
  };
  const reset = () => {
    updateConfig(instance.id, { running: false, startedAt: null, accumulatedMs: 0 });
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="font-bold tabular-nums text-[clamp(28px,16cqw,128px)]">
        {formatStopwatch(elapsed)}
      </div>
      <div className="flex gap-1">
        {!state.running ? (
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

- [ ] **Step 1.3: Meta + register**

Create `src/widgets/Stopwatch/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';

export const stopwatchMeta: WidgetMeta = {
  type: 'stopwatch',
  label: 'Stopwatch',
  icon: '⏲️',
  defaultSize: { width: 280, height: 180 },
  defaultConfig: { running: false, startedAt: null, accumulatedMs: 0 },
};
```

In `src/widgets/registry.ts`, add the import and registry entry:

```ts
import Stopwatch from './Stopwatch';
import { stopwatchMeta } from './Stopwatch/meta';
```

```ts
  stopwatch: { meta: stopwatchMeta, Component: Stopwatch },
```

- [ ] **Step 1.4: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Stopwatch widget"
```

---

## Task 2: Random Name Picker

**Files:**
- Create: `src/widgets/NamePicker/{index.tsx,meta.ts,Settings.tsx,logic.ts,logic.test.ts}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 2.1: Logic + tests**

Create `src/widgets/NamePicker/logic.ts`:

```ts
export const parseNames = (text: string): string[] =>
  text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export const pickIndex = (poolSize: number, rng: () => number = Math.random): number => {
  if (poolSize <= 0) return -1;
  return Math.floor(rng() * poolSize);
};
```

Create `src/widgets/NamePicker/logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseNames, pickIndex } from './logic';

describe('parseNames', () => {
  it('splits on newlines and commas', () => {
    expect(parseNames('Alice\nBob, Carol\n  Dan  ')).toEqual(['Alice', 'Bob', 'Carol', 'Dan']);
  });
  it('drops empties', () => {
    expect(parseNames('\n\nAlice\n')).toEqual(['Alice']);
  });
});

describe('pickIndex', () => {
  it('returns -1 for empty pool', () => {
    expect(pickIndex(0)).toBe(-1);
  });
  it('uses the seeded rng deterministically', () => {
    const rng = () => 0.5;
    expect(pickIndex(10, rng)).toBe(5);
    expect(pickIndex(4, rng)).toBe(2);
  });
});
```

Run: `npm test -- src/widgets/NamePicker/logic.test.ts` → expected 4 passing.

- [ ] **Step 2.2: Body**

Create `src/widgets/NamePicker/index.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { parseNames, pickIndex } from './logic';

export type NamePickerConfig = {
  namesText?: string;
  removePicked?: boolean;
  picked?: string[];
};

const SPIN_TOTAL_MS = 1100;
const SPIN_INTERVAL_MS = 60;

export default function NamePicker({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NamePickerConfig;
  const namesText = cfg.namesText ?? '';
  const removePicked = cfg.removePicked ?? false;
  const picked = cfg.picked ?? [];

  const all = parseNames(namesText);
  const pool = removePicked ? all.filter((n) => !picked.includes(n)) : all;

  const [display, setDisplay] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  const spin = () => {
    if (spinning) return;
    if (pool.length === 0) {
      setDisplay(removePicked && all.length > 0 ? '— all picked —' : '— add names —');
      return;
    }
    setSpinning(true);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= SPIN_TOTAL_MS) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const i = pickIndex(pool.length);
        const winner = pool[i];
        setDisplay(winner);
        setSpinning(false);
        if (removePicked) {
          updateConfig(instance.id, { picked: [...picked, winner] });
        }
        return;
      }
      setDisplay(pool[pickIndex(pool.length)]);
    }, SPIN_INTERVAL_MS);
  };

  const resetPicked = () => updateConfig(instance.id, { picked: [] });

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className={'font-bold text-center text-[clamp(20px,12cqw,72px)] ' + (spinning ? 'opacity-70' : '')}>
        {display ?? (pool.length === 0 ? '— add names —' : 'Tap "Pick"')}
      </div>
      <div className="flex gap-1">
        <button
          onClick={spin}
          disabled={spinning}
          className="px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm disabled:opacity-50"
        >
          Pick
        </button>
        {removePicked && picked.length > 0 && (
          <button
            onClick={resetPicked}
            className="px-3 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"
            title="Reset picked list"
          >
            Reset ({picked.length})
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2.3: Settings**

Create `src/widgets/NamePicker/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { NamePickerConfig } from '.';

export default function NamePickerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NamePickerConfig;
  const namesText = cfg.namesText ?? '';
  const removePicked = cfg.removePicked ?? false;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Name picker settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <label className="flex flex-col gap-1">
            <span>Names (one per line, or comma-separated)</span>
            <textarea
              rows={6}
              value={namesText}
              onChange={(e) => updateConfig(instance.id, { namesText: e.target.value })}
              placeholder={'Alice\nBob\nCarol'}
              className="border border-slate-300 rounded px-2 py-1 text-sm font-mono"
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Remove a name after picking</span>
            <input
              type="checkbox"
              checked={removePicked}
              onChange={(e) =>
                updateConfig(instance.id, {
                  removePicked: e.target.checked,
                  picked: e.target.checked ? (cfg.picked ?? []) : [],
                })
              }
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 2.4: Meta + register**

Create `src/widgets/NamePicker/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import NamePickerSettings from './Settings';

export const namePickerMeta: WidgetMeta = {
  type: 'namepicker',
  label: 'Name Picker',
  icon: '🎲',
  defaultSize: { width: 320, height: 200 },
  defaultConfig: { namesText: '', removePicked: false, picked: [] },
  Settings: NamePickerSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import NamePicker from './NamePicker';
import { namePickerMeta } from './NamePicker/meta';
```

```ts
  namepicker: { meta: namePickerMeta, Component: NamePicker },
```

- [ ] **Step 2.5: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Random Name Picker widget"
```

---

## Task 3: Dice / Random Number

**Files:**
- Create: `src/widgets/Dice/{index.tsx,meta.ts,Settings.tsx,logic.ts,logic.test.ts}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 3.1: Logic + tests**

Create `src/widgets/Dice/logic.ts`:

```ts
export type DiceMode = 'dice' | 'range';

export const rollDie = (rng: () => number = Math.random): number =>
  1 + Math.floor(rng() * 6);

export const rollDice = (count: number, rng: () => number = Math.random): number[] =>
  Array.from({ length: Math.max(1, Math.min(8, count)) }, () => rollDie(rng));

export const pickInRange = (
  min: number,
  max: number,
  rng: () => number = Math.random,
): number => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(rng() * (hi - lo + 1));
};

export const DIE_GLYPHS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
```

Create `src/widgets/Dice/logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rollDie, rollDice, pickInRange } from './logic';

describe('rollDie', () => {
  it('always returns 1..6', () => {
    for (let r = 0; r < 1; r += 0.001) {
      const v = rollDie(() => r);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollDice', () => {
  it('returns the requested count', () => {
    expect(rollDice(3, () => 0)).toHaveLength(3);
  });
  it('clamps count to 1..8', () => {
    expect(rollDice(0)).toHaveLength(1);
    expect(rollDice(99)).toHaveLength(8);
  });
});

describe('pickInRange', () => {
  it('inclusive of bounds', () => {
    expect(pickInRange(1, 10, () => 0)).toBe(1);
    expect(pickInRange(1, 10, () => 0.999999)).toBe(10);
  });
  it('handles reversed bounds', () => {
    expect(pickInRange(10, 1, () => 0)).toBe(1);
  });
});
```

Run: `npm test -- src/widgets/Dice/logic.test.ts` → expected 5 passing.

- [ ] **Step 3.2: Body**

Create `src/widgets/Dice/index.tsx`:

```tsx
import { useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { rollDice, pickInRange, DIE_GLYPHS, type DiceMode } from './logic';

export type DiceConfig = {
  mode?: DiceMode;
  count?: number;       // for 'dice'
  min?: number;         // for 'range'
  max?: number;
};

export default function Dice({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as DiceConfig;
  const mode: DiceMode = cfg.mode ?? 'dice';
  const count = cfg.count ?? 2;
  const min = cfg.min ?? 1;
  const max = cfg.max ?? 100;

  // Local-only state — these don't need to persist across reloads.
  const [dice, setDice] = useState<number[]>(() => rollDice(count));
  const [rangeValue, setRangeValue] = useState<number>(() => pickInRange(min, max));
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let n = 0;
    const id = window.setInterval(() => {
      if (mode === 'dice') setDice(rollDice(count));
      else setRangeValue(pickInRange(min, max));
      n += 1;
      if (n >= 8) {
        window.clearInterval(id);
        setRolling(false);
      }
    }, 70);
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none gap-2 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      {mode === 'dice' ? (
        <div className="flex items-center justify-center flex-wrap gap-2 text-[clamp(40px,18cqw,128px)] leading-none">
          {dice.map((d, i) => (
            <span key={i} className="tabular-nums">{DIE_GLYPHS[d]}</span>
          ))}
        </div>
      ) : (
        <div className="font-bold tabular-nums text-[clamp(28px,18cqw,128px)]">
          {rangeValue}
        </div>
      )}
      <button
        onClick={roll}
        disabled={rolling}
        className="px-4 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-sm disabled:opacity-50"
      >
        Roll
      </button>
    </div>
  );
}
```

- [ ] **Step 3.3: Settings**

Create `src/widgets/Dice/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { DiceConfig } from '.';

export default function DiceSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as DiceConfig;
  const mode = cfg.mode ?? 'dice';

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Dice settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-64">
          <div className="flex gap-1">
            <button
              onClick={() => updateConfig(instance.id, { mode: 'dice' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (mode === 'dice' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Dice
            </button>
            <button
              onClick={() => updateConfig(instance.id, { mode: 'range' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (mode === 'range' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Number range
            </button>
          </div>
          {mode === 'dice' ? (
            <label className="flex items-center justify-between gap-3">
              <span>Number of dice</span>
              <input
                type="number"
                min={1}
                max={8}
                value={cfg.count ?? 2}
                onChange={(e) =>
                  updateConfig(instance.id, { count: Number(e.target.value) })
                }
                className="w-16 border border-slate-300 rounded px-2 py-0.5"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <span>Min</span>
                <input
                  type="number"
                  value={cfg.min ?? 1}
                  onChange={(e) => updateConfig(instance.id, { min: Number(e.target.value) })}
                  className="w-20 border border-slate-300 rounded px-2 py-0.5"
                />
              </label>
              <label className="flex items-center gap-1">
                <span>Max</span>
                <input
                  type="number"
                  value={cfg.max ?? 100}
                  onChange={(e) => updateConfig(instance.id, { max: Number(e.target.value) })}
                  className="w-20 border border-slate-300 rounded px-2 py-0.5"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 3.4: Meta + register**

Create `src/widgets/Dice/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import DiceSettings from './Settings';

export const diceMeta: WidgetMeta = {
  type: 'dice',
  label: 'Dice',
  icon: '🎯',
  defaultSize: { width: 320, height: 200 },
  defaultConfig: { mode: 'dice', count: 2, min: 1, max: 100 },
  Settings: DiceSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import Dice from './Dice';
import { diceMeta } from './Dice/meta';
```

```ts
  dice: { meta: diceMeta, Component: Dice },
```

- [ ] **Step 3.5: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Dice / Random Number widget"
```

---

## Task 4: Traffic Light

**Files:**
- Create: `src/widgets/TrafficLight/{index.tsx,meta.ts}`
- Modify: `src/widgets/registry.ts`

No settings — clicking the light cycles or sets it directly.

- [ ] **Step 4.1: Body**

Create `src/widgets/TrafficLight/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type TrafficLightConfig = { active?: 'red' | 'yellow' | 'green' };

const COLORS: Array<{
  key: 'red' | 'yellow' | 'green';
  on: string;
  off: string;
}> = [
  { key: 'red',    on: 'bg-red-500',    off: 'bg-red-200' },
  { key: 'yellow', on: 'bg-yellow-400', off: 'bg-yellow-100' },
  { key: 'green',  on: 'bg-green-500',  off: 'bg-green-200' },
];

export default function TrafficLight({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TrafficLightConfig;
  const active = cfg.active ?? 'red';

  return (
    <div
      className="h-full w-full flex items-center justify-center bg-slate-900 p-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="flex flex-col gap-2 items-center justify-center h-full">
        {COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => updateConfig(instance.id, { active: c.key })}
            className={
              'rounded-full transition-all ' +
              (active === c.key ? c.on + ' shadow-[0_0_24px_rgba(255,255,255,0.45)]' : c.off + ' opacity-60')
            }
            style={{
              width: 'min(28cqw, 72px)',
              height: 'min(28cqw, 72px)',
            }}
            aria-label={c.key}
            aria-pressed={active === c.key}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Meta + register**

Create `src/widgets/TrafficLight/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';

export const trafficLightMeta: WidgetMeta = {
  type: 'trafficlight',
  label: 'Traffic Light',
  icon: '🚦',
  defaultSize: { width: 160, height: 360 },
  defaultConfig: { active: 'red' },
};
```

Add to `src/widgets/registry.ts`:

```ts
import TrafficLight from './TrafficLight';
import { trafficLightMeta } from './TrafficLight/meta';
```

```ts
  trafficlight: { meta: trafficLightMeta, Component: TrafficLight },
```

- [ ] **Step 4.3: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Traffic Light widget"
```

---

## Task 5: Work Symbols

**Files:**
- Create: `src/widgets/WorkSymbols/{index.tsx,meta.ts}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 5.1: Body**

Create `src/widgets/WorkSymbols/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

export type WorkSymbolKey = 'silent' | 'whisper' | 'partner' | 'group' | 'hand' | 'noaccess';

export type WorkSymbolsConfig = { active?: WorkSymbolKey | null };

const SYMBOLS: Array<{ key: WorkSymbolKey; icon: string; label: string }> = [
  { key: 'silent',   icon: '🤫', label: 'Silent' },
  { key: 'whisper',  icon: '🗣️', label: 'Whisper' },
  { key: 'partner',  icon: '👥', label: 'Partner' },
  { key: 'group',    icon: '👨‍👩‍👧‍👦', label: 'Group' },
  { key: 'hand',     icon: '✋', label: 'Hands up' },
  { key: 'noaccess', icon: '🚫', label: 'No talking' },
];

export default function WorkSymbols({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as WorkSymbolsConfig;
  const active = cfg.active ?? null;

  return (
    <div className="h-full w-full grid grid-cols-3 gap-2 p-2 bg-white">
      {SYMBOLS.map((s) => {
        const on = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() =>
              updateConfig(instance.id, { active: on ? null : s.key })
            }
            className={
              'rounded-lg flex flex-col items-center justify-center text-3xl transition-all p-1 ' +
              (on
                ? 'bg-slate-700 text-white shadow-inner'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 opacity-70')
            }
            aria-label={s.label}
            aria-pressed={on}
            title={s.label}
          >
            <span>{s.icon}</span>
            <span className="text-[10px] font-medium mt-1">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5.2: Meta + register**

Create `src/widgets/WorkSymbols/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';

export const workSymbolsMeta: WidgetMeta = {
  type: 'worksymbols',
  label: 'Work Symbols',
  icon: '🤫',
  defaultSize: { width: 360, height: 220 },
  defaultConfig: { active: null },
};
```

Add to `src/widgets/registry.ts`:

```ts
import WorkSymbols from './WorkSymbols';
import { workSymbolsMeta } from './WorkSymbols/meta';
```

```ts
  worksymbols: { meta: workSymbolsMeta, Component: WorkSymbols },
```

- [ ] **Step 5.3: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Work Symbols widget"
```

---

## Task 6: QR Code

**Files:**
- Create: `src/widgets/QRCode/{index.tsx,meta.ts,Settings.tsx}`
- Modify: `src/widgets/registry.ts`, `package.json`

- [ ] **Step 6.1: Install qrcode.react**

```bash
npm install qrcode.react
```

- [ ] **Step 6.2: Body**

Create `src/widgets/QRCode/index.tsx`:

```tsx
import { QRCodeSVG } from 'qrcode.react';
import type { WidgetInstance } from '../../store/types';

export type QRCodeConfig = { url?: string; caption?: string };

export default function QRCodeWidget({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as QRCodeConfig;
  const url = (cfg.url ?? '').trim();
  const caption = cfg.caption ?? '';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white p-3 gap-2">
      {url ? (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <QRCodeSVG
              value={url}
              level="M"
              style={{ height: '100%', width: 'auto', maxWidth: '100%' }}
            />
          </div>
          {caption && <div className="text-sm text-slate-600 text-center break-all">{caption}</div>}
        </>
      ) : (
        <div className="text-slate-400 text-sm text-center">
          Set a URL in ⚙ settings.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.3: Settings**

Create `src/widgets/QRCode/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { QRCodeConfig } from '.';

export default function QRCodeSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as QRCodeConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="QR settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2 w-72">
          <label className="flex flex-col gap-1">
            <span>URL</span>
            <input
              type="url"
              value={cfg.url ?? ''}
              onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
              placeholder="https://example.com"
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Caption (optional)</span>
            <input
              type="text"
              value={cfg.caption ?? ''}
              onChange={(e) => updateConfig(instance.id, { caption: e.target.value })}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 6.4: Meta + register**

Create `src/widgets/QRCode/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import QRCodeSettings from './Settings';

export const qrCodeMeta: WidgetMeta = {
  type: 'qrcode',
  label: 'QR Code',
  icon: '📱',
  defaultSize: { width: 240, height: 280 },
  defaultConfig: { url: '', caption: '' },
  Settings: QRCodeSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import QRCodeWidget from './QRCode';
import { qrCodeMeta } from './QRCode/meta';
```

```ts
  qrcode: { meta: qrCodeMeta, Component: QRCodeWidget },
```

- [ ] **Step 6.5: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add QR Code widget"
```

---

## Task 7: Image Embed

**Files:**
- Create: `src/widgets/ImageEmbed/{index.tsx,meta.ts,Settings.tsx}`
- Modify: `src/widgets/registry.ts`, `src/overlays/Background/cleanup.ts`

The image embed reuses the IDB image store. We'll also extend the cleanup logic to track image refs from widget configs.

- [ ] **Step 7.1: Body**

Create `src/widgets/ImageEmbed/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';
import { getImage } from '../../overlays/Background/idb';

export type ImageEmbedConfig = {
  source?: 'url' | 'upload';
  url?: string;
  imageId?: string;
  fit?: 'cover' | 'contain';
};

export default function ImageEmbed({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as ImageEmbedConfig;
  const fit = cfg.fit ?? 'contain';
  const source = cfg.source ?? 'url';

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    if (source === 'upload' && cfg.imageId) {
      getImage(cfg.imageId).then((blob) => {
        if (revoked || !blob) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      });
    } else {
      setBlobUrl(null);
    }
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, cfg.imageId]);

  const src = source === 'upload' ? blobUrl : (cfg.url ?? '').trim();
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm p-3 text-center">
        Set an image URL or upload one in ⚙.
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-full w-full bg-slate-100"
      style={{ objectFit: fit }}
    />
  );
}
```

- [ ] **Step 7.2: Settings**

Create `src/widgets/ImageEmbed/Settings.tsx`:

```tsx
import { useRef } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import { putImage, deleteImage } from '../../overlays/Background/idb';
import { resizeImage } from '../../overlays/Background/resize';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { ImageEmbedConfig } from '.';

export default function ImageEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ImageEmbedConfig;
  const fileInput = useRef<HTMLInputElement | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const id = await putImage(resized);
    if (cfg.source === 'upload' && cfg.imageId) {
      try { await deleteImage(cfg.imageId); } catch { /* ignore */ }
    }
    updateConfig(instance.id, { source: 'upload', imageId: id });
    e.target.value = '';
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
          aria-label="Image settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <div className="flex gap-1">
            <button
              onClick={() => updateConfig(instance.id, { source: 'url' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                ((cfg.source ?? 'url') === 'url' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              From URL
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (cfg.source === 'upload' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Upload
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </div>
          {(cfg.source ?? 'url') === 'url' && (
            <label className="flex flex-col gap-1">
              <span>Image URL</span>
              <input
                type="url"
                value={cfg.url ?? ''}
                onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
                placeholder="https://…"
                className="border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </label>
          )}
          <label className="flex items-center justify-between gap-3">
            <span>Fit</span>
            <select
              value={cfg.fit ?? 'contain'}
              onChange={(e) =>
                updateConfig(instance.id, { fit: e.target.value as 'cover' | 'contain' })
              }
              className="border border-slate-300 rounded px-1 py-0.5 text-sm"
            >
              <option value="contain">contain</option>
              <option value="cover">cover</option>
            </select>
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 7.3: Meta + register**

Create `src/widgets/ImageEmbed/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import ImageEmbedSettings from './Settings';

export const imageEmbedMeta: WidgetMeta = {
  type: 'image',
  label: 'Image',
  icon: '🖼️',
  defaultSize: { width: 320, height: 240 },
  defaultConfig: { source: 'url', url: '', fit: 'contain' },
  Settings: ImageEmbedSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import ImageEmbed from './ImageEmbed';
import { imageEmbedMeta } from './ImageEmbed/meta';
```

```ts
  image: { meta: imageEmbedMeta, Component: ImageEmbed },
```

- [ ] **Step 7.4: Extend image cleanup**

Edit `src/overlays/Background/cleanup.ts` so widgets that reference IDB images are also counted as referencing.

Replace the body of `collectReferencedImageIds`:

```ts
export const collectReferencedImageIds = (
  s: Pick<AppState, 'current' | 'presets'>,
): Set<string> => {
  const ids = new Set<string>();

  const collectFromScreen = (scr: { widgets: Array<{ type: string; config: Record<string, unknown> }>; background: AppState['current']['background'] }) => {
    if (scr.background.kind === 'image') ids.add(scr.background.imageId);
    for (const w of scr.widgets) {
      if (w.type === 'image') {
        const c = w.config as { source?: string; imageId?: string };
        if (c.source === 'upload' && typeof c.imageId === 'string') {
          ids.add(c.imageId);
        }
      }
    }
  };

  collectFromScreen(s.current);
  for (const p of s.presets) collectFromScreen(p.state);
  return ids;
};
```

Update the cleanup test in `src/overlays/Background/cleanup.test.ts`. Append a new test:

```ts
import type { WidgetInstance } from '../../store/types';

it('counts widget image references too', () => {
  const s = baseState();
  const w: WidgetInstance = {
    id: 'w1',
    type: 'image',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    zIndex: 1,
    config: { source: 'upload', imageId: 'img-1' },
  };
  s.current.widgets = [w];
  const ids = collectReferencedImageIds(s);
  expect(ids).toEqual(new Set(['img-1']));
});
```

Run: `npm test -- src/overlays/Background/cleanup.test.ts` → expected 3 passing.

- [ ] **Step 7.5: Commit**

```bash
git add -A
git commit -m "feat: add Image Embed widget (URL or upload), include in image cleanup"
```

---

## Task 8: Calendar / Date

**Files:**
- Create: `src/widgets/Calendar/{index.tsx,meta.ts,Settings.tsx}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 8.1: Body**

Create `src/widgets/Calendar/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

export type CalendarConfig = {
  showMonthGrid?: boolean;
};

const useToday = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // re-render once a minute is enough — date doesn't change often.
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const monthGrid = (now: Date) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; today: boolean }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, today: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, today: d === now.getDate() });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, today: false });
  return cells;
};

export default function Calendar({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as CalendarConfig;
  const showGrid = cfg.showMonthGrid ?? false;
  const now = useToday();

  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const dateLine = now.toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-800 select-none p-3 gap-1"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="text-[clamp(20px,8cqw,42px)] font-semibold">{weekday}</div>
      <div className="text-slate-500 text-[clamp(12px,4cqw,18px)]">{dateLine}</div>
      {showGrid && (
        <div className="grid grid-cols-7 gap-1 mt-2 text-xs w-full max-w-[280px]">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-slate-400">{d}</div>
          ))}
          {monthGrid(now).map((c, i) => (
            <div
              key={i}
              className={
                'text-center py-0.5 rounded ' +
                (c.day == null
                  ? ''
                  : c.today
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-700')
              }
            >
              {c.day ?? ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: Settings**

Create `src/widgets/Calendar/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { CalendarConfig } from '.';

export default function CalendarSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as CalendarConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Calendar settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <label className="flex items-center justify-between gap-3 cursor-pointer w-56">
          <span>Show month grid</span>
          <input
            type="checkbox"
            checked={cfg.showMonthGrid ?? false}
            onChange={(e) =>
              updateConfig(instance.id, { showMonthGrid: e.target.checked })
            }
          />
        </label>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 8.3: Meta + register**

Create `src/widgets/Calendar/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import CalendarSettings from './Settings';

export const calendarMeta: WidgetMeta = {
  type: 'calendar',
  label: 'Calendar',
  icon: '📅',
  defaultSize: { width: 280, height: 160 },
  defaultConfig: { showMonthGrid: false },
  Settings: CalendarSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import Calendar from './Calendar';
import { calendarMeta } from './Calendar/meta';
```

```ts
  calendar: { meta: calendarMeta, Component: Calendar },
```

- [ ] **Step 8.4: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Calendar / Date widget"
```

---

## Task 9: Push & verify deploy

- [ ] **Step 9.1: Push**

```bash
git push
gh run watch --exit-status
```

- [ ] **Step 9.2: Verify live**

Open `https://kiwispin.github.io/ClassroomScreen/`. The toolbar should now show ~12 widget icons. Click each new widget and exercise its settings.

---

## Phase 4 done — verification checklist

- [ ] `npm test` passes (added: 4 stopwatch logic, 4 name picker logic, 5 dice logic, 1 cleanup widget-image test).
- [ ] Toolbar shows: 🧪 Demo, 📝 Notepad, ⏰ Clock, ⏱️ Timer, ⏲️ Stopwatch, 🎲 Name Picker, 🎯 Dice, 🚦 Traffic Light, 🤫 Work Symbols, 📱 QR Code, 🖼️ Image, 📅 Calendar, then ✏️ Annotate.
- [ ] Each widget responds to interaction; each with settings has a working ⚙.
- [ ] QR Code renders for any URL you paste.
- [ ] Image Embed works for both URLs and uploads; uploads survive reload.
- [ ] Live URL shows the same.

When all boxes ticked, Phase 4 is done. Phase 5 (Tier 3: Noise Meter, Video Embed, Exit Poll) is next.
