import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

type CalendarCell = {
  date: Date;
  day: number;
  inMonth: boolean;
  today: boolean;
};

const sameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const monthGrid = (viewMonth: Date, today: Date): CalendarCell[] => {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < startWeekday; i++) {
    const day = prevMonthDays - startWeekday + i + 1;
    const date = new Date(year, month - 1, day);
    cells.push({ date, day, inMonth: false, today: sameDate(date, today) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, day: d, inMonth: true, today: sameDate(date, today) });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextDay);
    cells.push({ date, day: nextDay, inMonth: false, today: sameDate(date, today) });
    nextDay += 1;
  }
  return cells;
};

export default function Calendar({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as CalendarConfig;
  const showGrid = cfg.showMonthGrid ?? true;
  const now = useToday();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );

  const cells = useMemo(() => monthGrid(viewMonth, now), [viewMonth, now]);
  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

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
        <div className="h-full w-full flex flex-col text-slate-950">
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-[5cqi] pb-[3cqb] pt-[1cqb]">
            <button
              type="button"
              onClick={() =>
                setViewMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1))
              }
              className="flex h-[clamp(24px,8cqmin,42px)] w-[clamp(24px,8cqmin,42px)] items-center justify-center rounded-full text-slate-950 hover:bg-slate-100"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="h-[clamp(16px,4.5cqmin,28px)] w-[clamp(16px,4.5cqmin,28px)]" strokeWidth={3} />
            </button>
            <div
              className="text-center font-semibold leading-none"
              style={{ fontSize: 'clamp(18px,5.2cqmin,34px)' }}
            >
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={() =>
                setViewMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1))
              }
              className="ml-auto flex h-[clamp(24px,8cqmin,42px)] w-[clamp(24px,8cqmin,42px)] items-center justify-center rounded-full text-slate-950 hover:bg-slate-100"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="h-[clamp(16px,4.5cqmin,28px)] w-[clamp(16px,4.5cqmin,28px)]" strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-7 px-[7cqi] pb-[2cqb]">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div
                key={i}
                className="text-center font-medium leading-none text-slate-500"
                style={{ fontSize: 'clamp(12px,3.2cqmin,22px)' }}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mx-[7cqi] grid flex-1 min-h-0 grid-cols-7 overflow-hidden rounded-xl border-2 border-slate-300">
            {cells.map((c, i) => (
              <div
                key={i}
                className={
                  'relative flex items-center justify-center border-slate-300 font-semibold leading-none ' +
                  (i % 7 === 6 ? '' : 'border-r-2 ') +
                  (i < cells.length - 7 ? 'border-b-2 ' : '') +
                  (c.inMonth ? 'bg-white text-slate-950' : 'bg-slate-50 text-slate-300')
                }
                style={{ fontSize: 'clamp(14px,4.2cqmin,28px)' }}
              >
                {c.today ? (
                  <span className="flex aspect-square h-[62%] max-h-12 items-center justify-center rounded-full bg-[var(--w-accent,#6366f1)] text-white">
                    {c.day}
                  </span>
                ) : (
                  c.day
                )}
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
