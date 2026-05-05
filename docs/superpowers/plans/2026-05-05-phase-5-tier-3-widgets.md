# Phase 5 — Tier 3 Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the last three widgets — Noise Meter (microphone-driven volume bar), Video Embed (YouTube), Exit Poll (vote tallies). After Phase 5 the toolbar carries the full ClassroomScreen feature set.

**Architecture:** Each widget follows the established widget folder pattern. Noise Meter uses Web Audio's `AnalyserNode` over `MediaStream` from `getUserMedia`. Video Embed parses YouTube URL forms and renders an iframe. Exit Poll persists tallies via the widget config.

**Tech Stack additions:** None — Web Audio + getUserMedia are built-ins.

---

## File Structure

```
src/widgets/
  NoiseMeter/    index.tsx, meta.ts, Settings.tsx
  VideoEmbed/    index.tsx, meta.ts, Settings.tsx, parse.ts, parse.test.ts
  ExitPoll/      index.tsx, meta.ts
src/widgets/registry.ts (extended)
```

---

## Task 1: Video Embed (do this first — pure logic + iframe, easiest)

**Files:**
- Create: `src/widgets/VideoEmbed/{index.tsx,meta.ts,Settings.tsx,parse.ts,parse.test.ts}`
- Modify: `src/widgets/registry.ts`

- [ ] **Step 1.1: Parser + tests**

Create `src/widgets/VideoEmbed/parse.ts`:

```ts
// Returns the YouTube video ID, or null if the URL isn't a recognized YouTube link.
export const parseYouTubeId = (raw: string): string | null => {
  const url = raw.trim();
  if (!url) return null;

  // Bare 11-char id
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.replace(/^\//, '');
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = parsed.searchParams.get('v');
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const m = /^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/.exec(parsed.pathname);
    if (m) return m[1];
  }
  return null;
};
```

Create `src/widgets/VideoEmbed/parse.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseYouTubeId } from './parse';

describe('parseYouTubeId', () => {
  it('parses watch URLs', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=30')).toBe('dQw4w9WgXcQ');
  });
  it('parses youtu.be short links', () => {
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('parses embed/shorts paths', () => {
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('accepts a bare id', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('returns null for non-youtube URLs', () => {
    expect(parseYouTubeId('https://vimeo.com/12345')).toBeNull();
    expect(parseYouTubeId('not a url')).toBeNull();
    expect(parseYouTubeId('')).toBeNull();
  });
});
```

Run: `npm test -- src/widgets/VideoEmbed/parse.test.ts` → expected 5 passing.

- [ ] **Step 1.2: Body**

Create `src/widgets/VideoEmbed/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';
import { parseYouTubeId } from './parse';

export type VideoEmbedConfig = { url?: string };

export default function VideoEmbed({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as VideoEmbedConfig;
  const id = parseYouTubeId(cfg.url ?? '');

  if (!id) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm p-3 text-center">
        Paste a YouTube URL in ⚙ settings.
      </div>
    );
  }

  return (
    <iframe
      title="YouTube video"
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      className="h-full w-full bg-black"
      frameBorder={0}
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
```

- [ ] **Step 1.3: Settings**

Create `src/widgets/VideoEmbed/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { VideoEmbedConfig } from '.';

export default function VideoEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as VideoEmbedConfig;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Video settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <label className="flex flex-col gap-1 w-72">
          <span>YouTube URL</span>
          <input
            type="url"
            value={cfg.url ?? ''}
            onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          />
        </label>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 1.4: Meta + register**

Create `src/widgets/VideoEmbed/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import VideoEmbedSettings from './Settings';

export const videoEmbedMeta: WidgetMeta = {
  type: 'video',
  label: 'Video',
  icon: '📺',
  defaultSize: { width: 480, height: 280 },
  defaultConfig: { url: '' },
  Settings: VideoEmbedSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import VideoEmbed from './VideoEmbed';
import { videoEmbedMeta } from './VideoEmbed/meta';
```

```ts
  video: { meta: videoEmbedMeta, Component: VideoEmbed },
```

- [ ] **Step 1.5: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Video Embed widget (YouTube)"
```

---

## Task 2: Exit Poll

**Files:**
- Create: `src/widgets/ExitPoll/{index.tsx,meta.ts}`
- Modify: `src/widgets/registry.ts`

No popover settings — the Reset button on the widget body is enough.

- [ ] **Step 2.1: Body**

Create `src/widgets/ExitPoll/index.tsx`:

```tsx
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';

type Vote = 'up' | 'mid' | 'down';

export type ExitPollConfig = {
  up?: number;
  mid?: number;
  down?: number;
};

const OPTIONS: Array<{ key: Vote; icon: string; cls: string }> = [
  { key: 'up',   icon: '👍', cls: 'bg-emerald-500' },
  { key: 'mid',  icon: '😐', cls: 'bg-amber-500' },
  { key: 'down', icon: '👎', cls: 'bg-rose-500' },
];

export default function ExitPoll({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ExitPollConfig;
  const counts: Record<Vote, number> = {
    up: cfg.up ?? 0,
    mid: cfg.mid ?? 0,
    down: cfg.down ?? 0,
  };
  const total = counts.up + counts.mid + counts.down;

  const tally = (v: Vote) => {
    updateConfig(instance.id, { [v]: counts[v] + 1 });
  };
  const reset = () => updateConfig(instance.id, { up: 0, mid: 0, down: 0 });

  return (
    <div
      className="h-full w-full flex flex-col bg-white p-2 gap-2"
      style={{ containerType: 'inline-size' as const }}
    >
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {OPTIONS.map((o) => {
          const n = counts[o.key];
          const pct = total === 0 ? 0 : Math.round((n / total) * 100);
          return (
            <button
              key={o.key}
              onClick={() => tally(o.key)}
              className={
                'rounded-lg flex flex-col items-center justify-end p-2 text-white text-center hover:brightness-110 transition ' +
                o.cls
              }
            >
              <div className="text-[clamp(28px,16cqw,72px)] leading-none mb-1">{o.icon}</div>
              <div className="font-bold tabular-nums text-[clamp(20px,10cqw,42px)] leading-none">{n}</div>
              <div className="text-xs opacity-90">{pct}%</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Total votes: {total}</span>
        <button
          onClick={reset}
          disabled={total === 0}
          className="px-2 py-0.5 rounded hover:bg-slate-100 disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2: Meta + register**

Create `src/widgets/ExitPoll/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';

export const exitPollMeta: WidgetMeta = {
  type: 'poll',
  label: 'Poll',
  icon: '📊',
  defaultSize: { width: 360, height: 220 },
  defaultConfig: { up: 0, mid: 0, down: 0 },
};
```

Add to `src/widgets/registry.ts`:

```ts
import ExitPoll from './ExitPoll';
import { exitPollMeta } from './ExitPoll/meta';
```

```ts
  poll: { meta: exitPollMeta, Component: ExitPoll },
```

- [ ] **Step 2.3: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Exit Poll widget"
```

---

## Task 3: Noise Meter

**Files:**
- Create: `src/widgets/NoiseMeter/{index.tsx,meta.ts,Settings.tsx}`
- Modify: `src/widgets/registry.ts`

The Noise Meter uses `getUserMedia({ audio: true })` and an `AnalyserNode` to compute an RMS-based level (0..1). It updates the bar via `requestAnimationFrame`. When permission is denied, it shows a friendly state with a retry button. When the widget is removed, the mic stream is stopped.

- [ ] **Step 3.1: Body**

Create `src/widgets/NoiseMeter/index.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

export type NoiseMeterConfig = {
  threshold?: number; // 0..1; over this triggers the warning state
};

type Status = 'idle' | 'requesting' | 'running' | 'denied' | 'error';

export default function NoiseMeter({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as NoiseMeterConfig;
  const threshold = cfg.threshold ?? 0.5;

  const [status, setStatus] = useState<Status>('idle');
  const [level, setLevel] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = async () => {
    if (status === 'running' || status === 'requesting') return;
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxCtor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxCtor) {
        setStatus('error');
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioCtxCtor();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);

      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Light compression so values feel responsive
        setLevel(Math.min(1, rms * 1.6));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => { /* ignore */ });
      };
      setStatus('running');
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? '';
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error');
    }
  };

  // Stop the mic when the widget unmounts
  useEffect(() => () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const over = level >= threshold;
  const pct = Math.round(level * 100);

  return (
    <div className="h-full w-full flex flex-col bg-white p-3 gap-2">
      {status !== 'running' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          {status === 'denied' ? (
            <>
              <div className="text-sm text-slate-700">Microphone permission denied.</div>
              <div className="text-xs text-slate-500">
                Allow mic access in your browser, then click Try again.
              </div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
              >
                Try again
              </button>
            </>
          ) : status === 'error' ? (
            <>
              <div className="text-sm text-slate-700">Could not start the microphone.</div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-700">Noise meter</div>
              <button
                onClick={start}
                disabled={status === 'requesting'}
                className="mt-1 px-3 py-1 rounded bg-emerald-500 text-white text-sm hover:bg-emerald-600 disabled:opacity-50"
              >
                {status === 'requesting' ? 'Requesting…' : 'Start'}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 relative bg-slate-100 rounded overflow-hidden">
            <div
              className={'absolute left-0 right-0 bottom-0 transition-[height] duration-75 ' + (over ? 'bg-rose-500' : 'bg-emerald-500')}
              style={{ height: `${pct}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-slate-400/70"
              style={{ bottom: `${Math.round(threshold * 100)}%` }}
              aria-label={`Threshold ${Math.round(threshold * 100)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">{pct}%</span>
            <span>{over ? '🔊 Too loud' : '🤫 OK'}</span>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3.2: Settings**

Create `src/widgets/NoiseMeter/Settings.tsx`:

```tsx
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { NoiseMeterConfig } from '.';

export default function NoiseMeterSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as NoiseMeterConfig;
  const threshold = cfg.threshold ?? 0.5;

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
          aria-label="Noise meter settings"
          title="Settings"
        >
          ⚙
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-2 w-64">
          <label className="flex items-center justify-between gap-3">
            <span>Loudness threshold</span>
            <span className="text-slate-500 tabular-nums">{Math.round(threshold * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(threshold * 100)}
            onChange={(e) =>
              updateConfig(instance.id, { threshold: Number(e.target.value) / 100 })
            }
          />
        </div>
      )}
    </SettingsPopover>
  );
}
```

- [ ] **Step 3.3: Meta + register**

Create `src/widgets/NoiseMeter/meta.ts`:

```ts
import type { WidgetMeta } from '../Demo/meta';
import NoiseMeterSettings from './Settings';

export const noiseMeterMeta: WidgetMeta = {
  type: 'noisemeter',
  label: 'Noise',
  icon: '🔊',
  defaultSize: { width: 240, height: 240 },
  defaultConfig: { threshold: 0.5 },
  Settings: NoiseMeterSettings,
};
```

Add to `src/widgets/registry.ts`:

```ts
import NoiseMeter from './NoiseMeter';
import { noiseMeterMeta } from './NoiseMeter/meta';
```

```ts
  noisemeter: { meta: noiseMeterMeta, Component: NoiseMeter },
```

- [ ] **Step 3.4: Verify + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat: add Noise Meter widget (microphone level + threshold)"
```

---

## Task 4: Push & verify deploy

- [ ] **Step 4.1: Push**

```bash
git push
gh run watch --exit-status
```

- [ ] **Step 4.2: Verify live**

Open `https://kiwispin.github.io/ClassroomScreen/`. Toolbar should now show every widget (15 in total): clock, notepad, timer, stopwatch, name picker, dice, traffic light, work symbols, qr code, image, calendar, video, noise, poll, then annotate / presets / background.

---

## Phase 5 done — verification checklist

- [ ] `npm test` passes (added: 5 YouTube parse tests).
- [ ] Video Embed: paste a YouTube watch URL — embed renders. Try a `youtu.be/…` short link and an `embed/…` URL.
- [ ] Exit Poll: 👍/😐/👎 buttons increment, percentages update, Reset zeroes them out.
- [ ] Noise Meter: click Start → browser prompts for mic → bar reflects ambient noise → threshold marker visible → over-threshold turns the bar red. Deny permission → "denied" state with Try again.
- [ ] Removing the Noise Meter tile stops the mic (browser tab indicator goes away).
- [ ] Live URL behaves identically.

When all boxes ticked, Phase 5 is done. Only Phase 6 (polish) remains.
