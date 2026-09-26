import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetInstance } from '../store/types';
import { useAppStore } from '../store/store';
import WidgetCanvas from './WidgetCanvas';

vi.mock('react-rnd', () => ({
  Rnd: ({ minWidth, disableDragging, enableResizing, children }: { minWidth: number; disableDragging: boolean; enableResizing: { topLeft: boolean }; children: ReactNode }) => (
    <div data-testid="resizable-widget" data-min-width={minWidth} data-drag-disabled={disableDragging} data-resize-enabled={enableResizing.topLeft}>{children}</div>
  ),
}));
vi.mock('./WidgetChrome', () => ({ default: () => null }));
vi.mock('./WidgetTile', () => ({ default: () => null }));

const widget = (id: string, type: WidgetInstance['type']): WidgetInstance => ({
  id,
  type,
  position: { x: 0, y: 0 },
  size: { width: 440, height: 300 },
  zIndex: 1,
  config: {},
});

describe('WidgetCanvas resize limits', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [widget('timetable', 'timetable'), widget('clock', 'clock')] },
    }));
  });

  it('uses a 280px minimum for Timetable without changing other widgets', () => {
    render(<WidgetCanvas />);

    expect(screen.getAllByTestId('resizable-widget').map((element) => element.getAttribute('data-min-width')))
      .toEqual(['280', '120']);
  });
  it('disables dragging and resizing for locked widgets and in focus mode', () => {
    useAppStore.setState((s) => ({ current: { ...s.current, widgets: [{ ...widget('clock', 'clock'), locked: true }] } }));
    const { rerender } = render(<WidgetCanvas />);
    expect(screen.getByTestId('resizable-widget')).toHaveAttribute('data-drag-disabled', 'true');
    expect(screen.getByTestId('resizable-widget')).toHaveAttribute('data-resize-enabled', 'false');
    rerender(<WidgetCanvas focusMode />);
    expect(screen.getByTestId('resizable-widget')).toHaveAttribute('data-drag-disabled', 'true');
  });

});
