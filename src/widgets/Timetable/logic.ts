export type TimetableMode = 'list' | 'checklist' | 'timed';
export type TimetableItemKind = 'activity' | 'break';
export type TimetableTimeFormat = '12' | '24';

export type TimetableItem = {
  id: string;
  kind: TimetableItemKind;
  title: string;
  durationMinutes: number;
  completed?: boolean;
  icon?: string;
  imageId?: string;
};

export type TimetableConfig = {
  mode?: TimetableMode;
  title?: string;
  showTitle?: boolean;
  startTime?: string;
  timeFormat?: TimetableTimeFormat;
  alarm?: string;
  activities?: TimetableItem[];
};

export type TimelineRow = {
  activity: TimetableItem;
  startMinute: number;
  endMinute: number;
  startOffset: number;
  endOffset: number;
  state: 'upcoming' | 'active' | 'ended';
  progress: number;
};

export type Timeline = {
  error: string | null;
  totalMinutes: number;
  elapsedMinutes: number;
  rows: TimelineRow[];
};

export const DEFAULT_START_TIME = '08:00';
export const DEFAULT_ACTIVITY_MINUTES = 60;
export const DEFAULT_BREAK_MINUTES = 30;
export const MIN_DURATION_MINUTES = 1;
export const DURATION_STEP_MINUTES = 5;
export const MAX_SCHEDULE_MINUTES = 24 * 60;

const DAY_MINUTES = 24 * 60;

export const readTimetableItems = (value: unknown): TimetableItem[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Record<string, unknown>;
    if (item.kind !== 'activity' && item.kind !== 'break') return [];
    const kind = item.kind;
    const durationMinutes = Number.isFinite(item.durationMinutes)
      ? Number(item.durationMinutes)
      : kind === 'break' ? DEFAULT_BREAK_MINUTES : DEFAULT_ACTIVITY_MINUTES;
    return [{
      id: typeof item.id === 'string' && item.id ? item.id : `timetable-item-${index}`,
      kind,
      title: kind === 'activity' && typeof item.title === 'string' ? item.title : '',
      durationMinutes,
      ...(typeof item.completed === 'boolean' ? { completed: item.completed } : {}),
      ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
      ...(typeof item.imageId === 'string' ? { imageId: item.imageId } : {}),
    }];
  });
};

export const parseStartTime = (value: string): number | null => {
  const match = /^(\d{2}):([0-5]\d)$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  return hours * 60 + Number(match[2]);
};

export const totalDurationMinutes = (items: readonly TimetableItem[]): number =>
  items.reduce((total, item) => total + (Number.isFinite(item.durationMinutes)
    ? item.durationMinutes : 0), 0);

export const validateSchedule = (
  startTime: string,
  items: readonly TimetableItem[],
): string | null => {
  if (parseStartTime(startTime) == null) return 'Choose a valid start time.';
  if (items.some((item) => !Number.isInteger(item.durationMinutes)
    || item.durationMinutes < MIN_DURATION_MINUTES)) {
    return 'Each duration must be at least 1 minute.';
  }
  if (totalDurationMinutes(items) > MAX_SCHEDULE_MINUTES) {
    return 'The complete schedule cannot exceed 24 hours.';
  }
  return null;
};

const elapsedForSchedule = (startMinute: number, totalMinutes: number, now: Date): number => {
  const clockMinute = now.getHours() * 60 + now.getMinutes()
    + now.getSeconds() / 60 + now.getMilliseconds() / 60_000;
  const elapsed = clockMinute - startMinute;
  if (elapsed >= 0) return elapsed;
  const crossesMidnight = startMinute + totalMinutes >= DAY_MINUTES;
  return crossesMidnight ? elapsed + DAY_MINUTES : elapsed;
};

export const buildTimeline = (
  items: readonly TimetableItem[],
  startTime: string,
  now: Date,
): Timeline => {
  const error = validateSchedule(startTime, items);
  const totalMinutes = totalDurationMinutes(items);
  const startMinute = parseStartTime(startTime);
  if (error || startMinute == null) {
    return { error, totalMinutes, elapsedMinutes: 0, rows: [] };
  }

  const elapsedMinutes = elapsedForSchedule(startMinute, totalMinutes, now);
  let cursor = 0;
  const rows: TimelineRow[] = [];
  for (const item of items) {
    const startOffset = cursor;
    cursor += item.durationMinutes;
    if (item.kind === 'break') continue;
    const endOffset = cursor;
    const startClock = (startMinute + startOffset) % DAY_MINUTES;
    const endClock = (startMinute + endOffset) % DAY_MINUTES;
    const state = elapsedMinutes < startOffset
      ? 'upcoming'
      : elapsedMinutes < endOffset ? 'active' : 'ended';
    rows.push({
      activity: item,
      startMinute: startClock,
      endMinute: endClock,
      startOffset,
      endOffset,
      state,
      progress: state === 'active'
        ? Math.max(0, Math.min(1, (elapsedMinutes - startOffset) / item.durationMinutes))
        : state === 'ended' ? 1 : 0,
    });
  }

  return { error: null, totalMinutes, elapsedMinutes, rows };
};

export const formatClockTime = (minute: number, format: TimetableTimeFormat): string => {
  const normalized = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(normalized / 60);
  const minutes = Math.floor(normalized % 60);
  const paddedMinutes = String(minutes).padStart(2, '0');
  if (format === '24') return `${String(hours).padStart(2, '0')}:${paddedMinutes}`;
  const period = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${paddedMinutes} ${period}`;
};

export const reorderItem = (
  items: readonly TimetableItem[],
  sourceId: string,
  targetId: string,
): TimetableItem[] => {
  if (sourceId === targetId) return [...items];
  const source = items.findIndex((item) => item.id === sourceId);
  const target = items.findIndex((item) => item.id === targetId);
  if (source < 0 || target < 0) return [...items];
  const next = [...items];
  const [moved] = next.splice(source, 1);
  next.splice(target, 0, moved);
  return next;
};

export const reorderActivity = (
  items: readonly TimetableItem[],
  sourceId: string,
  targetId: string,
): TimetableItem[] => {
  if (sourceId === targetId) return [...items];
  const activitySlots: number[] = [];
  const activities: TimetableItem[] = [];
  items.forEach((item, index) => {
    if (item.kind === 'activity') {
      activitySlots.push(index);
      activities.push(item);
    }
  });
  const source = activities.findIndex((item) => item.id === sourceId);
  const target = activities.findIndex((item) => item.id === targetId);
  if (source < 0 || target < 0) return [...items];
  const [moved] = activities.splice(source, 1);
  activities.splice(target, 0, moved);
  const next = [...items];
  activitySlots.forEach((slot, index) => { next[slot] = activities[index]; });
  return next;
};

export const moveActivity = (
  items: readonly TimetableItem[],
  activityId: string,
  direction: -1 | 1,
): TimetableItem[] => {
  const visibleActivities = items.filter((item) => item.kind === 'activity');
  const index = visibleActivities.findIndex((item) => item.id === activityId);
  const target = visibleActivities[index + direction];
  return target ? reorderActivity(items, activityId, target.id) : [...items];
};

export const moveItem = (
  items: readonly TimetableItem[],
  itemId: string,
  direction: -1 | 1,
): TimetableItem[] => {
  const index = items.findIndex((item) => item.id === itemId);
  const target = items[index + direction];
  return target ? reorderItem(items, itemId, target.id) : [...items];
};

export const removeActivity = (
  items: readonly TimetableItem[],
  activityId: string,
): TimetableItem[] => items.filter((item) => item.id !== activityId);

export const addBreakAfterActivity = (
  items: readonly TimetableItem[],
  activityId: string,
  id: string,
  durationMinutes = DEFAULT_BREAK_MINUTES,
): TimetableItem[] => {
  const index = items.findIndex((item) => item.id === activityId && item.kind === 'activity');
  if (index < 0 || items[index + 1]?.kind === 'break') return [...items];
  const next = [...items];
  next.splice(index + 1, 0, {
    id,
    kind: 'break',
    title: '',
    durationMinutes,
  });
  return next;
};

export const adjustDuration = (
  items: readonly TimetableItem[],
  itemId: string,
  direction: -1 | 1,
): TimetableItem[] => {
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) return [...items];
  const nextDuration = Math.max(
    MIN_DURATION_MINUTES,
    item.durationMinutes + direction * DURATION_STEP_MINUTES,
  );
  if (nextDuration === item.durationMinutes) return [...items];
  if (direction > 0) {
    const otherDuration = totalDurationMinutes(items) - item.durationMinutes;
    if (otherDuration + nextDuration > MAX_SCHEDULE_MINUTES) return [...items];
  }
  return items.map((candidate) => candidate.id === itemId
    ? { ...candidate, durationMinutes: nextDuration }
    : candidate);
};
