import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN } from '../store/types';
import { allWidgets } from '../widgets/registry';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import Toolbar from './Toolbar';

vi.mock('../overlays/Background/Picker', () => ({ default: () => <button>background</button> }));
vi.mock('./BackgroundMusicControl', () => ({ default: () => <button>music</button> }));
vi.mock('./PresetMenu', () => ({ default: () => <button>presets</button> }));

beforeEach(() => useAppStore.setState({ toolbarWidgets: undefined, toolbarHidden: false, annotateOpen: false, current: { ...DEFAULT_SCREEN, widgets: [] }, layoutPast: [], layoutFuture: [] }));

describe('Widget bar', () => {
  it('keeps legacy defaults, removes stale/duplicate preferences and allows no favourites', () => {
    expect(resolveToolbarWidgets(undefined, allWidgets).map((w) => w.type)).toEqual(allWidgets.filter((w) => !w.secondary).map((w) => w.type));
    expect(resolveToolbarWidgets(['timer', 'missing', 'timer', 'demo', 'clock'], allWidgets).map((w) => w.type)).toEqual(['timer', 'clock']);
    expect(resolveToolbarWidgets([], allWidgets)).toEqual([]);
  });

  it('updates accessible instance counts as widgets are added and removed', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);
    const clock = screen.getByRole('button', { name: 'clock' });
    expect(clock).toHaveAccessibleDescription('0 on the current screen');
    await user.click(clock); await user.click(clock);
    expect(clock).toHaveAccessibleDescription('2 on the current screen');
    act(() => useAppStore.getState().removeWidget(useAppStore.getState().current.widgets[0].id));
    expect(clock).toHaveAccessibleDescription('1 on the current screen');
  });

  it('shows extra widgets in a compact popup and adds without changing favourites', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);
    await user.click(screen.getByRole('button', { name: 'more' }));
    const dialog = screen.getByRole('dialog', { name: 'More widgets' });
    expect(within(dialog).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'clock' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'calendar' }));
    expect(useAppStore.getState().current.widgets[0].type).toBe('calendar');
    expect(useAppStore.getState().toolbarWidgets).toBeUndefined();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toHaveFocus();
  });

  it('adds, reorders, removes and restores favourites with persisted order', async () => {
    useAppStore.setState({ toolbarWidgets: ['clock', 'timer'] });
    const user = userEvent.setup();
    render(<Toolbar />);
    await user.click(screen.getByRole('button', { name: 'more' }));
    await user.click(screen.getByRole('button', { name: 'Edit widget bar' }));
    await user.click(screen.getByRole('button', { name: 'Move Timer earlier' }));
    expect(useAppStore.getState().toolbarWidgets).toEqual(['timer', 'clock']);
    await user.click(screen.getByRole('button', { name: 'Add Calendar to favourites' }));
    expect(JSON.parse(localStorage.getItem('classroomscreen-state')!).state.toolbarWidgets).toEqual(['timer', 'clock', 'calendar']);
    await user.click(screen.getByRole('button', { name: 'Remove Clock from favourites' }));
    expect(useAppStore.getState().toolbarWidgets).toEqual(['timer', 'calendar']);
    await user.click(screen.getByRole('button', { name: 'Restore default bar' }));
    expect(useAppStore.getState().toolbarWidgets).toEqual(allWidgets.filter((w) => !w.secondary).map((w) => w.type));
  });

  it('dismisses the popup with Escape and outside clicks', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);
    const more = screen.getByRole('button', { name: 'more' });
    await user.click(more);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(more).toHaveFocus();
    await user.click(more);
    await user.click(screen.getByRole('button', { name: 'clock' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps More available with no favourites and offers a visible show button when hidden', async () => {
    useAppStore.setState({ toolbarWidgets: [] });
    const user = userEvent.setup();
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: 'more' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Hide bar' }));
    expect(screen.queryByRole('navigation', { name: 'Widget bar' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show widget bar' }));
    expect(screen.getByRole('button', { name: 'more' })).toBeVisible();
  });
});
