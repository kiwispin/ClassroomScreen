// One global <defs> block that the toolbar / chrome icons reference via
// `stroke="url(#grad-…)"`. Lighter shade at the top, darker at the bottom —
// gives the line icons a subtle metallic / "expensive" feel without
// touching every icon individually.

type Stop = { offset: string; color: string };
type Grad = { id: string; stops: [Stop, Stop] };

const GRADIENTS: Grad[] = [
  { id: 'grad-slate',    stops: [{ offset: '0%', color: '#94a3b8' }, { offset: '100%', color: '#1e293b' }] },
  { id: 'grad-sky',      stops: [{ offset: '0%', color: '#7dd3fc' }, { offset: '100%', color: '#0369a1' }] },
  { id: 'grad-amber',    stops: [{ offset: '0%', color: '#fcd34d' }, { offset: '100%', color: '#b45309' }] },
  { id: 'grad-orange',   stops: [{ offset: '0%', color: '#fdba74' }, { offset: '100%', color: '#c2410c' }] },
  { id: 'grad-indigo',   stops: [{ offset: '0%', color: '#a5b4fc' }, { offset: '100%', color: '#4338ca' }] },
  { id: 'grad-fuchsia',  stops: [{ offset: '0%', color: '#f0abfc' }, { offset: '100%', color: '#a21caf' }] },
  { id: 'grad-rose',     stops: [{ offset: '0%', color: '#fda4af' }, { offset: '100%', color: '#be123c' }] },
  { id: 'grad-red',      stops: [{ offset: '0%', color: '#fca5a5' }, { offset: '100%', color: '#b91c1c' }] },
  { id: 'grad-violet',   stops: [{ offset: '0%', color: '#c4b5fd' }, { offset: '100%', color: '#5b21b6' }] },
  { id: 'grad-emerald',  stops: [{ offset: '0%', color: '#6ee7b7' }, { offset: '100%', color: '#047857' }] },
  { id: 'grad-pink',     stops: [{ offset: '0%', color: '#f9a8d4' }, { offset: '100%', color: '#be185d' }] },
  { id: 'grad-purple',   stops: [{ offset: '0%', color: '#d8b4fe' }, { offset: '100%', color: '#6b21a8' }] },
  { id: 'grad-cyan',     stops: [{ offset: '0%', color: '#67e8f9' }, { offset: '100%', color: '#0e7490' }] },
];

// Maps a Tailwind color class (or hue substring) to the matching gradient id.
// Example: "text-amber-500" → "grad-amber".
export const gradientForColor = (cls: string | undefined): string | undefined => {
  if (!cls) return undefined;
  const m = /(?:^|\s)text-([a-z]+)-/.exec(cls);
  if (!m) return undefined;
  const id = `grad-${m[1]}`;
  return GRADIENTS.some((g) => g.id === id) ? id : undefined;
};

export default function GradientDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      style={{ position: 'absolute', pointerEvents: 'none' }}
    >
      <defs>
        {GRADIENTS.map((g) => (
          <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
            {g.stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}
