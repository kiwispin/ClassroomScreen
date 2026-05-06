import { useEffect, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

export type CalendarConfig = {
  showMonthGrid?: boolean;
};

const useToday = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const monthGrid = (now: Date) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
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
      className="h-full w-full flex flex-col items-center justify-center select-none p-3 gap-1"
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
