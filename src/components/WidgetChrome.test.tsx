import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '../store/store';
import type { WidgetInstance, WidgetType } from '../store/types';
import WidgetChrome from './WidgetChrome';

const widgetId = 'chrome-glass-test';
const makeWidget = (type: WidgetType): WidgetInstance => ({
  id: widgetId,
  type,
  position: { x: 0, y: 0 },
  size: { width: 280, height: 140 },
  zIndex: 1,
  config: { theme: 'default' },
});

function ConnectedWidgetChrome() {
  const instance = useAppStore((state) =>
    state.current.widgets.find((widget) => widget.id === widgetId),
  );
  return instance ? <WidgetChrome instance={instance} /> : null;
}

describe('WidgetChrome glass controls', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [makeWidget('clock')] },
    }));
  });

  it.each([
    { type: 'clock' as const, hasGlass: true },
    { type: 'timer' as const, hasGlass: true },
    { type: 'stopwatch' as const, hasGlass: true },
    { type: 'notepad' as const, hasGlass: true },
    { type: 'qrcode' as const, hasGlass: true },
    { type: 'video' as const, hasGlass: false },
  ])('exposes appropriate glass controls for $type', async ({ type, hasGlass }) => {
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [makeWidget(type)] },
    }));
    const user = userEvent.setup();
    render(<ConnectedWidgetChrome />);
    await user.click(screen.getByRole('button', { name: 'Color theme' }));

    expect(screen.queryByRole('checkbox', { name: 'Frosted glass' }) !== null).toBe(hasGlass);
    expect(screen.queryByRole('slider', { name: 'Glass opacity' }) !== null).toBe(hasGlass);
  });
});
