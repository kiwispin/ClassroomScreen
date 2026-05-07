import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

type ClockConfig = {
  format24?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
  analog?: boolean;
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

// --- Analog face ----------------------------------------------------------

const AnalogFace = ({ now, showSeconds }: { now: Date; showSeconds: boolean }) => {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  // Smooth: minute hand drifts with seconds, hour hand drifts with minutes.
  const hourDeg = h * 30 + m * 0.5;
  const minDeg = m * 6 + s * 0.1;
  const secDeg = s * 6;

  // Pre-compute hour-tick endpoints in SVG space (viewBox 100x100, center 50,50).
  const hourTicks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const inner = isMain ? 38 : 41;
    const outer = 46;
    return {
      i,
      x1: 50 + Math.cos(angle) * inner,
      y1: 50 + Math.sin(angle) * inner,
      x2: 50 + Math.cos(angle) * outer,
      y2: 50 + Math.sin(angle) * outer,
      isMain,
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
      {/* Face circle — soft outline, no fill so the theme tile bg shows through */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />

      {/* Hour ticks */}
      {hourTicks.map((t) => (
        <line
          key={t.i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeOpacity={t.isMain ? 0.85 : 0.4}
          strokeWidth={t.isMain ? 2.2 : 1.2}
          strokeLinecap="round"
        />
      ))}

      {/* Hour hand */}
      <line
        x1="50"
        y1="58"
        x2="50"
        y2="26"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform={`rotate(${hourDeg} 50 50)`}
      />

      {/* Minute hand */}
      <line
        x1="50"
        y1="60"
        x2="50"
        y2="14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        transform={`rotate(${minDeg} 50 50)`}
      />

      {/* Second hand — uses theme accent if available */}
      {showSeconds && (
        <>
          <line
            x1="50"
            y1="62"
            x2="50"
            y2="11"
            stroke="var(--w-accent, #f43f5e)"
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${secDeg} 50 50)`}
            style={{ transition: 'transform 100ms linear' }}
          />
          <circle
            cx="50"
            cy="50"
            r="2"
            fill="var(--w-accent, #f43f5e)"
          />
        </>
      )}

      {/* Pin */}
      <circle cx="50" cy="50" r="1.5" fill="currentColor" />
    </svg>
  );
};

// --- Component ------------------------------------------------------------

export default function Clock({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as ClockConfig;
  const showSeconds = cfg.showSeconds ?? false;
  const analog = cfg.analog ?? false;

  // Analog mode always ticks every second so hands move smoothly even when
  // the user has "Show seconds" off.
  const tickMs = analog ? 1000 : showSeconds ? 1000 : 15000;
  const now = useNow(tickMs);

  const format24 = cfg.format24 ?? true;
  const showDate = cfg.showDate ?? true;

  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (analog) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center select-none p-3 gap-2"
        style={{ containerType: 'size' as const }}
      >
        <div
          className="flex items-center justify-center"
          style={{ width: 'min(80cqi, 80cqb)', height: 'min(80cqi, 80cqb)' }}
        >
          <AnalogFace now={now} showSeconds={showSeconds} />
        </div>
        {showDate && (
          <div
            className="opacity-60 text-center"
            style={{ fontSize: 'min(4.5cqi, 5cqb)' }}
          >
            {date}
          </div>
        )}
      </div>
    );
  }

  let h = now.getHours();
  let suffix = '';
  if (!format24) {
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
  }
  const time = `${pad(h)}:${pad(now.getMinutes())}${
    showSeconds ? `:${pad(now.getSeconds())}` : ''
  }${suffix}`;

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center select-none gap-1 p-3"
      style={{ containerType: 'size' as const }}
    >
      <div className="font-bold tabular-nums leading-none text-[clamp(32px,min(20cqw,46cqh),260px)]">
        {time}
      </div>
      {showDate && (
        <div className="opacity-60 text-[clamp(11px,min(4cqw,9cqh),28px)]">
          {date}
        </div>
      )}
    </div>
  );
}
