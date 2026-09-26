import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Notepad from './index';
import { useAppStore } from '../../store/store';
import { DEFAULT_SCREEN } from '../../store/types';
it('preserves existing text while saving whole-note formatting', () => {
  useAppStore.setState({ current: { ...DEFAULT_SCREEN, widgets: [{ id: 'note', type: 'notepad', position: { x: 0, y: 0 }, size: { width: 480, height: 300 }, zIndex: 1, config: { text: 'Existing lesson instructions' } }] } });
  function Harness() { const instance = useAppStore(s => s.current.widgets[0]); return <Notepad instance={instance} />; }
  render(<Harness />);
  fireEvent.focus(screen.getByRole('textbox', { name: 'Note text' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bold note' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Note font size' }), { target: { value: '32' } });
  fireEvent.click(screen.getByRole('button', { name: 'Align note center' }));
  expect(useAppStore.getState().current.widgets[0].config).toMatchObject({ text: 'Existing lesson instructions', bold: true, autoFit: false, fontSize: 32, align: 'center' });
  expect(screen.getByRole('textbox')).toHaveStyle({ fontWeight: '700', fontSize: '32px', textAlign: 'center' });
});
