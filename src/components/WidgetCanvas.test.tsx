import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetInstance } from '../store/types';
import { useAppStore } from '../store/store';
import WidgetCanvas from './WidgetCanvas';

vi.mock('react-rnd', () => ({
  Rnd: ({ minWidth, children }: { minWidth: number; children: ReactNode }) => (
    <div data-testid="resizable-widget" data-min-width={minWidth}>{children}</div>
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
});
