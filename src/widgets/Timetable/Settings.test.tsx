import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import TimetableSettings from './Settings';
import type { TimetableConfig, TimetableItem } from './logic';

const makeInstance = (config: TimetableConfig): WidgetInstance => ({
  id: 'timetable-settings-test',
  type: 'timetable',
  position: { x: 0, y: 0 },
  size: { width: 440, height: 420 },
  zIndex: 1,
  config: config as Record<string, unknown>,
});

const reading: TimetableItem = {
  id: 'reading', kind: 'activity', title: 'Reading', durationMinutes: 60, completed: true,
};
const gap: TimetableItem = { id: 'gap', kind: 'break', title: '', durationMinutes: 30 };
const maths: TimetableItem = { id: 'maths', kind: 'activity', title: 'Maths', durationMinutes: 60 };

function ConnectedSettings() {
  const instance = useAppStore((state) =>
    state.current.widgets.find((widget) => widget.id === 'timetable-settings-test'),
  );
  return instance ? <TimetableSettings instance={instance} /> : null;
}

const storedItems = (): TimetableItem[] => useAppStore.getState()
  .current.widgets[0].config.activities as TimetableItem[];

describe('Timetable settings', () => {
  beforeEach(() => {
    const instance = makeInstance({
      mode: 'timed',
      title: "What's going on today",
      showTitle: true,
      startTime: '08:00',
      timeFormat: '12',
      alarm: 'bell',
      activities: [reading, gap, maths],
    });
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [instance] },
      presets: [],
    }));
  });

  it('keeps breaks and completion data while hiding break rows in List and Checklist editors', async () => {
    const user = userEvent.setup();
    const before = storedItems();
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));
    expect(screen.getByText('Break')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.queryByText('Break')).not.toBeInTheDocument();
    expect(storedItems()).toEqual(before);

    await user.click(screen.getByRole('button', { name: 'Checklist' }));
    expect(screen.queryByText('Break')).not.toBeInTheDocument();
    expect(storedItems()).toEqual(before);

    await user.click(screen.getByRole('button', { name: 'Timed schedule' }));
    expect(screen.getByText('Break')).toBeInTheDocument();
    expect(storedItems()).toEqual(before);
  });

  it('accepts manual minute durations and keeps the +/- controls in five-minute steps', async () => {
    const user = userEvent.setup();
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));

    const duration = screen.getByRole('spinbutton', { name: 'Reading duration in minutes' });
    expect(duration).toHaveAttribute('min', '1');
    await user.clear(duration);
    await user.type(duration, '37');
    await user.tab();
    await waitFor(() => expect(storedItems()[0].durationMinutes).toBe(37));

    await user.click(screen.getAllByRole('button', { name: 'Increase activity duration' })[0]);
    expect(storedItems()[0].durationMinutes).toBe(42);
  });

  it('enables moving an activity above a leading break in timed mode', async () => {
    const user = userEvent.setup();
    const current = useAppStore.getState().current.widgets[0];
    const config = current.config as TimetableConfig;
    useAppStore.setState((state) => ({
      current: {
        ...state.current,
        widgets: [{ ...current, config: { ...config, activities: [gap, reading] } }],
      },
    }));
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));

    const moveUp = screen.getByRole('button', { name: 'Move Reading up' });
    expect(moveUp).toBeEnabled();
    await user.click(moveUp);
    expect(storedItems().map((item) => item.id)).toEqual(['reading', 'gap']);
  });

  it('resets manual duration text to the accepted value when it clamps to the existing maximum', async () => {
    const user = userEvent.setup();
    const current = useAppStore.getState().current.widgets[0];
    const config = current.config as TimetableConfig;
    useAppStore.setState((state) => ({
      current: {
        ...state.current,
        widgets: [{
          ...current,
          config: {
            ...config,
            activities: [{ ...reading, durationMinutes: 1350 }, gap, maths],
          },
        }],
      },
    }));
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));

    const duration = screen.getByRole('spinbutton', { name: 'Reading duration in minutes' });
    await user.clear(duration);
    await user.type(duration, '2000');
    await user.tab();

    expect(storedItems()[0].durationMinutes).toBe(1350);
    expect(duration).toHaveValue(1350);
  });

  it('edits and moves break rows independently in timed mode', async () => {
    const user = userEvent.setup();
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));

    await user.click(screen.getByRole('button', { name: 'Move break down' }));
    expect(storedItems().map((item) => item.id)).toEqual(['reading', 'maths', 'gap']);
    await user.click(screen.getByRole('button', { name: 'Remove break' }));
    expect(storedItems().map((item) => item.id)).toEqual(['reading', 'maths']);
  });

  it('allows adding activities in List mode even when their stored durations exceed a day', async () => {
    const user = userEvent.setup();
    const current = useAppStore.getState().current.widgets[0];
    const config = current.config as TimetableConfig;
    useAppStore.setState((state) => ({
      current: {
        ...state.current,
        widgets: [{
          ...current,
          config: { ...config, mode: 'list', activities: [{ ...reading, durationMinutes: 1440 }] },
        }],
      },
    }));
    render(<ConnectedSettings />);
    await user.click(screen.getByRole('button', { name: 'Timetable settings' }));
    const add = screen.getByRole('button', { name: 'Add activity' });
    expect(add).toBeEnabled();
    await user.click(add);
    expect(storedItems()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Timed schedule' }));
    expect(screen.getByRole('alert')).toHaveTextContent('24 hours');
  });
});
