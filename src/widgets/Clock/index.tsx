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
