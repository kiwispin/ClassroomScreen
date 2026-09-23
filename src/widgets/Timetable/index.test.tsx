import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { playSfx } from '../../lib/audio';
import Timetable from './index';
import type { TimetableConfig } from './logic';

vi.mock('../../lib/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/audio')>();
  return { ...actual, playSfx: vi.fn() };
});

const makeInstance = (config: TimetableConfig, width = 440): WidgetInstance => ({
  id: 'timetable-display-test',
  type: 'timetable',
  position: { x: 0, y: 0 },
  size: { width, height: 420 },
  zIndex: 1,
  config: config as Record<string, unknown>,
});

function ConnectedTimetable() {
  const instance = useAppStore((state) =>
    state.current.widgets.find((widget) => widget.id === 'timetable-display-test'),
  );
  return instance ? <Timetable instance={instance} /> : null;
}

const install = (config: TimetableConfig, width = 440) => {
  const instance = makeInstance(config, width);
  useAppStore.setState((state) => ({
    current: { ...state.current, widgets: [instance] },
    presets: [],
  }));
};

describe('Timetable display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    install({
      mode: 'checklist',
      title: "What's going on today",
      showTitle: true,
      startTime: '08:00',
      timeFormat: '12',
      alarm: 'none',
      activities: [
        { id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 60, completed: false },
        { id: 'gap', kind: 'break', title: '', durationMinutes: 30 },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('opens the settings panel from the empty state and keeps it open after adding its first activity', async () => {
    install({ mode: 'timed', startTime: '08:00', activities: [] });
    const user = userEvent.setup();
    render(<ConnectedTimetable />);

    await user.click(screen.getByRole('button', { name: 'Edit activities' }));
    expect(screen.getByRole('dialog', { name: 'Timetable settings' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add activity' }));

    expect(useAppStore.getState().current.widgets[0].config.activities).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Timetable settings' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Activity 1 name' })).toBeInTheDocument();
  });

  it('keeps the pictogram full opacity and strikes through only a completed checklist title', async () => {
    const user = userEvent.setup();
    render(<ConnectedTimetable />);

    const title = screen.getByText('Reading');
    const pictogram = screen.getByRole('button', { name: 'Add pictogram' });
    const checkbox = screen.getByRole('checkbox', { name: 'Mark Reading complete' });
    expect(title).not.toHaveClass('line-through');
    await user.click(checkbox);

    expect(title).toHaveClass('line-through');
    expect(pictogram).not.toHaveClass('opacity-50');
    expect((useAppStore.getState().current.widgets[0].config.activities as Array<{ completed?: boolean }>)[0].completed)
      .toBe(true);
  });

  it('keeps enlarged pictograms and time ranges readable at the 280px minimum width', () => {
    install({
      mode: 'timed',
      title: 'Today',
      startTime: '22:00',
      timeFormat: '12',
      activities: [{ id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 60 }],
    }, 280);
    render(<div style={{ width: 280, height: 220 }}><ConnectedTimetable /></div>);

    const row = screen.getByRole('listitem');
    expect(row).toHaveClass('min-h-[60px]', 'items-center');
    expect(screen.getByRole('button', { name: 'Add pictogram' })).toHaveClass('h-11', 'w-11');
    expect(screen.getByText('10:00 PM – 11:00 PM')).toHaveClass('whitespace-normal');
  });

  it('uses the approved typography in all modes at 280px and 440px without a title scrollbar', () => {
    for (const width of [280, 440]) {
      for (const mode of ['timed', 'list', 'checklist'] as const) {
        install({
          mode,
          title: "What's going on today",
          startTime: '22:00',
          timeFormat: '12',
          activities: [{ id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 20 }],
        }, width);
        const view = render(<div style={{ width, height: 420 }}><ConnectedTimetable /></div>);

        const heading = screen.getByRole('heading', { name: "What's going on today" });
        expect(heading).toHaveClass('max-h-16', 'overflow-hidden', 'text-[18px]', 'leading-[1.2]');
        expect(heading).not.toHaveClass('overflow-y-auto');
        expect(screen.getByText('Reading')).toHaveClass('text-[16px]', 'leading-[1.2]');
        expect(screen.getByRole('listitem')).toHaveClass(
          mode === 'timed' ? 'min-h-[60px]' : 'min-h-[56px]',
        );
        if (mode === 'timed') {
          expect(screen.getByText('10:00 PM – 10:20 PM')).toHaveClass('text-[12px]', 'leading-[1.2]', 'whitespace-normal');
        }

        view.unmount();
      }
    }
  });

  it('plays the selected alarm once at the exact wall-clock activity end', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 23, 8, 59, 59));
    install({
      mode: 'timed',
      startTime: '08:00',
      alarm: 'bell',
      activities: [{ id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 60 }],
    });
    const { unmount } = render(<ConnectedTimetable />);
    expect(playSfx).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(999); });
    expect(playSfx).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenCalledWith('bell');
    unmount();
  });

  it('does not sound for an already-ended activity on mount or after changing settings', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 23, 9, 1));
    install({
      mode: 'timed',
      startTime: '08:00',
      alarm: 'bell',
      activities: [{ id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 60 }],
    });
    render(<ConnectedTimetable />);
    expect(playSfx).not.toHaveBeenCalled();

    act(() => useAppStore.getState().updateWidgetConfig('timetable-display-test', { alarm: 'ding' }));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(playSfx).not.toHaveBeenCalled();
  });
});
