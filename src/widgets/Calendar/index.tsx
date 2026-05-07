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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="h-full w-full select-none p-3"
      style={{ containerType: 'size' as const }}
    >
      {showGrid ? (
        <div className="h-full w-full flex flex-col gap-2">
          <div className="text-center">
            <div className="font-semibold leading-tight" style={{ fontSize: 'min(8cqi,11cqb)' }}>
              {weekday}
            </div>
            <div className="opacity-60" style={{ fontSize: 'min(4.5cqi,6cqb)' }}>
              {dateLine}
            </div>
          </div>
          <div
            className="grid grid-cols-7 flex-1 min-h-0 gap-[2%] content-start"
            style={{ fontSize: 'min(3.5cqi,4.5cqb)' }}
          >
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center opacity-50 font-medium">
                {d}
              </div>
            ))}
            {monthGrid(now).map((c, i) => (
              <div
                key={i}
                className={
                  'flex items-center justify-center aspect-square rounded-md ' +
                  (c.day == null
                    ? ''
                    : c.today
                      ? 'text-white font-semibold'
                      : 'opacity-80')
                }
                style={
                  c.today
                    ? { background: 'var(--w-accent, #6366f1)' }
                    : undefined
                }
              >
                {c.day ?? ''}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-1">
          <div
            className="font-semibold leading-tight text-center"
            style={{ fontSize: 'min(14cqi,28cqb)' }}
          >
            {weekday}
          </div>
          <div
            className="opacity-60 text-center"
            style={{ fontSize: 'min(7cqi,12cqb)' }}
          >
            {dateLine}
          </div>
        </div>
      )}
    </div>
  );
}
