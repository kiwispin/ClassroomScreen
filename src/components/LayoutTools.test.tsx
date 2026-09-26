import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN } from '../store/types';
import LayoutTools, { useLayoutShortcuts } from './LayoutTools';

function Harness() { useLayoutShortcuts(); return <><input aria-label="Note" /><LayoutTools /></>; }
beforeEach(() => useAppStore.setState({ current: { ...DEFAULT_SCREEN, widgets: [{ id: 'a', type: 'notepad', position: { x: 10, y: 40 }, size: { width: 200, height: 100 }, zIndex: 1, config: {} }] }, layoutPast: [], layoutFuture: [], selectedWidgetIds: [], annotateOpen: false, snapToGrid: false }));
it('scopes undo away from text inputs, annotation and dialogs', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  act(() => useAppStore.getState().commitWidgetLayout('a', { x: 100, y: 100 }));
  fireEvent.keyDown(screen.getByLabelText('Note'), { key: 'z', ctrlKey: true });
  expect(useAppStore.getState().layoutPast).toHaveLength(1);
  act(() => useAppStore.setState({ annotateOpen: true }));
  fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
  expect(useAppStore.getState().layoutPast).toHaveLength(1);
  act(() => useAppStore.setState({ annotateOpen: false }));
  await user.click(screen.getByRole('button', { name: 'Arrange widgets' }));
  await user.click(screen.getByRole('checkbox', { name: 'Snap to grid' }));
  expect(useAppStore.getState().snapToGrid).toBe(true);
  fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
  expect(useAppStore.getState().layoutPast).toHaveLength(1);
  await user.keyboard('{Escape}');
  fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
  expect(useAppStore.getState().layoutPast).toHaveLength(0);
  fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
  expect(useAppStore.getState().layoutPast).toHaveLength(1);
});
