import { describe, expect, it } from 'vitest';
import {
  addBreakAfterActivity,
  adjustDuration,
  buildTimeline,
  formatClockTime,
  moveActivity,
  moveItem,
  parseStartTime,
  readTimetableItems,
  removeActivity,
  reorderActivity,
  validateSchedule,
  type TimetableItem,
} from './logic';

const activity = (id: string, durationMinutes = 60): TimetableItem => ({
  id,
  kind: 'activity',
  title: id,
  durationMinutes,
});

const pause = (id: string, durationMinutes = 30): TimetableItem => ({
  id,
  kind: 'break',
  title: '',
  durationMinutes,
});

describe('Timetable timing', () => {
  it('places breaks as gaps without adding them to displayed activity rows', () => {
    const timeline = buildTimeline(
      [activity('reading'), pause('break'), activity('maths')],
      '08:00',
      new Date(2026, 8, 23, 8, 30),
    );

    expect(timeline.error).toBeNull();
    expect(timeline.rows.map(({ activity: item, startMinute, endMinute }) => ({
      title: item.title,
      start: formatClockTime(startMinute, '24'),
      end: formatClockTime(endMinute, '24'),
    }))).toEqual([
      { title: 'reading', start: '08:00', end: '09:00' },
      { title: 'maths', start: '09:30', end: '10:30' },
    ]);
    expect(timeline.rows[0].state).toBe('active');
    expect(timeline.rows[0].progress).toBe(0.5);
    expect(timeline.rows[1].state).toBe('upcoming');
  });

  it('uses wall-clock time across midnight and wraps displayed ranges', () => {
    const timeline = buildTimeline(
      [activity('reading', 60), pause('break', 30), activity('maths', 30)],
      '23:30',
      new Date(2026, 8, 24, 0, 0),
    );

    expect(timeline.rows.map(({ startMinute, endMinute, state, progress }) => ({
      range: `${formatClockTime(startMinute, '24')}-${formatClockTime(endMinute, '24')}`,
      state,
      progress,
    }))).toEqual([
      { range: '23:30-00:30', state: 'active', progress: 0.5 },
      { range: '01:00-01:30', state: 'upcoming', progress: 0 },
    ]);
  });

  it('keeps ordinary morning schedules upcoming and marks a previous overnight schedule ended', () => {
    const upcoming = buildTimeline([activity('lesson', 60)], '08:00', new Date(2026, 8, 23, 7));
    const overnight = buildTimeline([activity('lesson', 60)], '23:30', new Date(2026, 8, 24, 1));

    expect(upcoming.elapsedMinutes).toBe(-60);
    expect(upcoming.rows[0].state).toBe('upcoming');
    expect(overnight.rows[0].state).toBe('ended');
  });

  it('uses inclusive starts and exclusive ends at activity boundaries', () => {
    const items = [activity('one'), pause('break', 30), activity('two')];
    expect(buildTimeline(items, '08:00', new Date(2026, 8, 23, 9)).rows.map((row) => row.state))
      .toEqual(['ended', 'upcoming']);
    expect(buildTimeline(items, '08:00', new Date(2026, 8, 23, 9, 30)).rows.map((row) => row.state))
      .toEqual(['ended', 'active']);
  });

  it('formats 12-hour and 24-hour ranges', () => {
    expect(formatClockTime(8 * 60, '12')).toBe('8:00 AM');
    expect(formatClockTime(12 * 60, '12')).toBe('12:00 PM');
    expect(formatClockTime(0, '12')).toBe('12:00 AM');
    expect(formatClockTime(8 * 60, '24')).toBe('08:00');
  });

  it('validates wall-clock input, durations, and the 24-hour cap', () => {
    expect(parseStartTime('08:00')).toBe(480);
    expect(parseStartTime('24:00')).toBeNull();
    expect(parseStartTime('8:00')).toBeNull();
    expect(validateSchedule('08:00', [activity('day', 1440)])).toBeNull();
    expect(validateSchedule('08:00', [activity('day', 1445)])).toContain('24 hours');
    expect(validateSchedule('08:00', [activity('short', 0)])).toContain('at least 1');
    expect(buildTimeline([activity('bad', 1445)], '08:00', new Date()).rows).toEqual([]);
  });
});

describe('Timetable editing helpers', () => {
  it('reorders timed rows independently and preserves hidden break slots when reordering activities', () => {
    const items = [activity('reading'), pause('gap'), activity('maths')];
    expect(moveActivity(items, 'maths', -1).map((item) => item.id))
      .toEqual(['maths', 'gap', 'reading']);
    expect(reorderActivity(items, 'maths', 'reading').map((item) => item.id))
      .toEqual(['maths', 'gap', 'reading']);
    expect(moveItem(items, 'gap', 1).map((item) => item.id))
      .toEqual(['reading', 'maths', 'gap']);
    expect(removeActivity(items, 'reading').map((item) => item.id)).toEqual(['gap', 'maths']);
  });

  it('inserts one default break after an activity and prevents a duplicate gap', () => {
    const items = [activity('reading'), activity('maths')];
    const withBreak = addBreakAfterActivity(items, 'reading', 'break-1');
    expect(withBreak.map((item) => item.id)).toEqual(['reading', 'break-1', 'maths']);
    expect(withBreak[1]).toMatchObject({ kind: 'break', durationMinutes: 30, title: '' });
    expect(addBreakAfterActivity(withBreak, 'reading', 'break-2')).toEqual(withBreak);
  });

  it('adjusts durations by five minutes without exceeding a day, and can repair invalid totals', () => {
    const items = [activity('one', 1435), pause('break', 5)];
    expect(adjustDuration(items, 'one', 1)).toEqual(items);
    expect(adjustDuration(items, 'one', -1)[0].durationMinutes).toBe(1430);
    expect(adjustDuration([activity('one', 1445)], 'one', -1)[0].durationMinutes).toBe(1440);
  });

  it('reads stored activity and break entries without dropping completion or pictogram references', () => {
    expect(readTimetableItems([
      { id: 'done', kind: 'activity', title: 'Reading', durationMinutes: 60, completed: true, icon: 'book-open' },
      { id: 'gap', kind: 'break', durationMinutes: 30 },
      null,
    ])).toEqual([
      { id: 'done', kind: 'activity', title: 'Reading', durationMinutes: 60, completed: true, icon: 'book-open' },
      { id: 'gap', kind: 'break', title: '', durationMinutes: 30 },
    ]);
  });
});
