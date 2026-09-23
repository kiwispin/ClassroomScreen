import { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { SFX_NAMES, playSfx } from '../../lib/audio';
import {
  buildTimeline,
  formatClockTime,
  readTimetableItems,
  type TimetableConfig,
  type TimetableItem,
  type TimetableMode,
  type TimetableTimeFormat,
} from './logic';
import TimetableSettings from './Settings';
import { PictogramPicker } from './Pictograms';

const activityTitle = (item: TimetableItem) => item.title.trim() || 'Activity';

export default function Timetable({ instance }: { instance: WidgetInstance }) {
  const updateConfig = useAppStore((state) => state.updateWidgetConfig);
  const cfg = instance.config as TimetableConfig;
  const mode: TimetableMode = cfg.mode === 'list' || cfg.mode === 'checklist'
    ? cfg.mode : 'timed';
  const startTime = cfg.startTime ?? '08:00';
  const format: TimetableTimeFormat = cfg.timeFormat === '24' ? '24' : '12';
  const items = readTimetableItems(cfg.activities);
  const activities = useMemo(() => items.filter((item) => item.kind === 'activity'), [items]);
  const [now, setNow] = useState(() => Date.now());
  const alarmBaseline = useRef<{
    signature: string;
    timestamp: number;
    elapsedMinutes: number;
  } | null>(null);
  const scheduleSignature = JSON.stringify([
    mode,
    startTime,
    items.map(({ id, kind, durationMinutes }) => [id, kind, durationMinutes]),
  ]);
  const timeline = buildTimeline(items, startTime, new Date(now));

  useEffect(() => {
    if (mode !== 'timed') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const previous = alarmBaseline.current;
    if (
      mode === 'timed'
      && !timeline.error
      && previous?.signature === scheduleSignature
    ) {
      const elapsedMs = now - previous.timestamp;
      if (elapsedMs > 0 && elapsedMs <= 5000) {
        const ended = timeline.rows.some((row) =>
          previous.elapsedMinutes < row.endOffset
          && timeline.elapsedMinutes >= row.endOffset,
        );
        if (ended && SFX_NAMES.includes((cfg.alarm ?? 'bell') as (typeof SFX_NAMES)[number])) {
          playSfx((cfg.alarm ?? 'bell') as (typeof SFX_NAMES)[number]);
        }
      }
    }
    alarmBaseline.current = {
      signature: scheduleSignature,
      timestamp: now,
      elapsedMinutes: timeline.elapsedMinutes,
    };
  }, [cfg.alarm, mode, now, scheduleSignature, timeline.elapsedMinutes, timeline.error, timeline.rows]);

  const setActivityPictogram = (
    itemId: string,
    value: { icon?: string; imageId?: string },
  ) => {
    updateConfig(instance.id, {
      activities: items.map((item) => item.id === itemId && item.kind === 'activity'
        ? { ...item, icon: undefined, imageId: undefined, ...value }
        : item),
    });
  };

  const toggleActivity = (itemId: string, completed: boolean) => {
    updateConfig(instance.id, {
      activities: items.map((item) => item.id === itemId && item.kind === 'activity'
        ? { ...item, completed }
        : item),
    });
  };

  const showTitle = cfg.showTitle ?? true;
  const title = cfg.title ?? "What's going on today";

  return (
    <div
      className="flex h-full w-full flex-col gap-2 overflow-hidden p-3"
      style={{ containerType: 'size' as const }}
    >
      {showTitle && (
        <h2 className="max-h-16 shrink-0 overflow-hidden whitespace-normal break-words pb-px text-[18px] font-semibold leading-[1.2] text-[var(--w-text)]">
          {title}
        </h2>
      )}

      {mode === 'timed' && timeline.error && (
        <p role="alert" className="shrink-0 rounded-md bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
          {timeline.error}
        </p>
      )}

      <div
        role="list"
        aria-label="Timetable activities"
        className="min-h-0 flex-1 space-y-1.5 overflow-y-auto"
      >
        <div className={activities.length === 0
          ? 'flex h-full min-h-20 items-center justify-center'
          : 'hidden'}>
          <TimetableSettings instance={instance} inlineTrigger />
        </div>
        {activities.length > 0 && mode === 'timed' && !timeline.error ? (
          timeline.rows.map((row) => {
            const name = activityTitle(row.activity);
            const active = row.state === 'active';
            const ended = row.state === 'ended';
            return (
              <div
                key={row.activity.id}
                role="listitem"
                className={`flex min-h-[60px] items-center gap-2 rounded-md px-2.5 py-2 transition-colors ${active ? 'bg-[var(--w-accent,#6366f1)] text-white' : 'text-[var(--w-text)]'}`}
              >
                <PictogramPicker
                  icon={row.activity.icon}
                  imageId={row.activity.imageId}
                  size="display"
                  onChange={(value) => setActivityPictogram(row.activity.id, value)}
                />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <span className="whitespace-normal break-words text-[16px] font-semibold leading-[1.2]" title={name}>{name}</span>
                  <span className={`whitespace-normal text-[12px] tabular-nums leading-[1.2] ${active ? 'text-white/90' : 'opacity-70'}`}>
                    {formatClockTime(row.startMinute, format)} – {formatClockTime(row.endMinute, format)}
                  </span>
                  {active && (
                    <div
                      role="progressbar"
                      aria-label={`${name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.floor(row.progress * 100)}
                      className="h-1.5 w-full overflow-hidden rounded-full bg-white/30"
                    >
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-700"
                        style={{ width: `${row.progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {ended && (
                  <span
                    className="flex h-7 w-7 shrink-0 self-center items-center justify-center rounded-full border border-current opacity-65"
                    aria-label={`${name} ended`}
                    title="Ended"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </div>
            );
          })
        ) : activities.length > 0 ? (
          activities.map((item) => {
            const name = activityTitle(item);
            const completed = mode === 'checklist' && item.completed === true;
            return (
              <div
                key={item.id}
                role="listitem"
                className="flex min-h-[56px] items-center gap-2 rounded-md px-2.5 py-1.5 text-[var(--w-text)]"
              >
                <PictogramPicker
                  icon={item.icon}
                  imageId={item.imageId}
                  size="display"
                  onChange={(value) => setActivityPictogram(item.id, value)}
                />
                <span className={`min-w-0 flex-1 whitespace-normal break-words text-[16px] font-medium leading-[1.2] ${completed ? 'line-through' : ''}`}>
                  {name}
                </span>
                {mode === 'checklist' && (
                  <input
                    type="checkbox"
                    aria-label={`Mark ${name} complete`}
                    checked={completed}
                    onChange={(event) => toggleActivity(item.id, event.target.checked)}
                    className="h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300"
                    style={{ accentColor: 'var(--w-accent, #6366f1)' }}
                  />
                )}
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}
