import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetInstance } from '../../store/types';
import { useAppStore } from '../../store/store';
import { SFX_NAMES } from '../../lib/audio';
import { deleteAudio, playCustomAudio } from '../../lib/audio-storage';
import TimerSettings from './Settings';

vi.mock('../../lib/audio-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/audio-storage')>();
  return {
    ...actual,
    deleteAudio: vi.fn().mockResolvedValue(undefined),
    playCustomAudio: vi.fn().mockResolvedValue(undefined),
  };
});

const initialTimer: WidgetInstance = {
  id: 'timer-settings-test',
  type: 'timer',
  position: { x: 0, y: 0 },
  size: { width: 480, height: 200 },
  zIndex: 1,
  config: {
    fullDurationMs: 5 * 60_000,
    durationMs: 3 * 60_000,
    running: true,
    startedAt: 123_456,
    sfx: 'bell',
    warningMinutes: [],
    warningSfx: 'ding',
    autoReset: false,
  },
};

function ConnectedTimerSettings() {
  const instance = useAppStore((state) =>
    state.current.widgets.find((widget) => widget.id === initialTimer.id),
  );
  return instance ? <TimerSettings instance={instance} /> : null;
}

describe('TimerSettings', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [{ ...initialTimer, config: { ...initialTimer.config } }] },
    }));
  });

  it('preserves warning choices and a running timer when an unchanged duration blurs', async () => {
    const user = userEvent.setup();
    render(<ConnectedTimerSettings />);
    await user.click(screen.getByRole('button', { name: 'Timer settings' }));

    const duration = screen.getByRole('textbox', { name: 'Duration (MM:SS)' });
    expect(duration).toHaveValue('05:00');
    expect(screen.getByRole('combobox', { name: 'Warning sound' })).toHaveValue('ding');
    expect(screen.getAllByRole('checkbox').every((control) => !(control as HTMLInputElement).checked)).toBe(true);

    const fiveMinuteWarning = screen.getByRole('checkbox', { name: /^5 min$/ });
    await user.click(fiveMinuteWarning);
    await waitFor(() => expect(fiveMinuteWarning).toBeChecked());
    await user.click(fiveMinuteWarning);
    await waitFor(() => expect(fiveMinuteWarning).not.toBeChecked());

    const twoMinuteWarning = screen.getByRole('checkbox', { name: /^2 min$/ });
    await user.click(twoMinuteWarning);
    await waitFor(() => expect(twoMinuteWarning).toBeChecked());
    expect(useAppStore.getState().current.widgets[0].config.warningMinutes).toEqual([2]);

    await user.click(duration);
    await user.tab();
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      fullDurationMs: 5 * 60_000,
      durationMs: 3 * 60_000,
      running: true,
      startedAt: 123_456,
      warningMinutes: [2],
      warningSfx: 'ding',
    });

    act(() => {
      useAppStore.getState().updateWidgetConfig(initialTimer.id, {
        fullDurationMs: 6 * 60_000,
        durationMs: 6 * 60_000,
        running: false,
        startedAt: null,
      });
    });
    await waitFor(() => expect(duration).toHaveValue('06:00'));
  });

  it('offers the shared custom sound and all built-in sounds for warnings', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.setState((state) => ({
        current: {
          ...state.current,
          widgets: [{
            ...initialTimer,
            config: {
              ...initialTimer.config,
              sfx: 'bell',
              warningSfx: 'ding',
              customSoundId: 'audio-123',
              customSoundName: 'bell-recording.mp3',
            },
          }],
        },
      }));
    });
    render(<ConnectedTimerSettings />);
    await user.click(screen.getByRole('button', { name: 'Timer settings' }));

    const finishSound = screen.getByRole('combobox', { name: 'Timer sound' });
    const warningSound = screen.getByRole('combobox', { name: 'Warning sound' });
    expect(Array.from(finishSound.querySelectorAll('option')).map((option) => option.value))
      .toEqual([...SFX_NAMES, 'custom']);
    expect(Array.from(warningSound.querySelectorAll('option')).map((option) => option.value))
      .toEqual(['none', ...SFX_NAMES, 'custom']);

    await user.selectOptions(warningSound, 'fanfare');
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      sfx: 'bell',
      warningSfx: 'fanfare',
    });

    await user.selectOptions(finishSound, 'alarm');
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      sfx: 'alarm',
      warningSfx: 'fanfare',
      customSoundId: 'audio-123',
    });
    await user.selectOptions(warningSound, 'custom');
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      sfx: 'alarm',
      warningSfx: 'custom',
      customSoundId: 'audio-123',
    });
    expect(screen.getByRole('button', { name: 'Preview warning sound' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Preview warning sound' }));
    expect(playCustomAudio).toHaveBeenCalledWith('audio-123');

    await user.selectOptions(warningSound, 'none');
    expect(screen.getByRole('button', { name: 'Preview warning sound' })).toBeDisabled();
    expect(useAppStore.getState().current.widgets[0].config.customSoundId).toBe('audio-123');
  });

  it('removes the shared upload without changing a different finish sound', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.setState((state) => ({
        current: {
          ...state.current,
          widgets: [{
            ...initialTimer,
            config: {
              ...initialTimer.config,
              sfx: 'alarm',
              warningSfx: 'custom',
              customSoundId: 'audio-123',
              customSoundName: 'bell-recording.mp3',
            },
          }],
        },
      }));
    });
    render(<ConnectedTimerSettings />);
    await user.click(screen.getByRole('button', { name: 'Timer settings' }));
    await user.click(screen.getByRole('button', { name: 'Remove custom sound' }));

    await waitFor(() => expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      sfx: 'alarm',
      warningSfx: 'chime',
      customSoundId: undefined,
      customSoundName: undefined,
    }));
    expect(deleteAudio).toHaveBeenCalledWith('audio-123');
  });
});
