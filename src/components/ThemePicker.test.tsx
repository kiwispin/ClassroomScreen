import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/store';
import type { WidgetInstance } from '../store/types';
import ThemePicker from './ThemePicker';

const timer: WidgetInstance = {
  id: 'timer-theme-test',
  type: 'timer',
  position: { x: 0, y: 0 },
  size: { width: 480, height: 200 },
  zIndex: 1,
  config: { theme: 'midnight' },
};

function ConnectedThemePicker() {
  const instance = useAppStore((state) =>
    state.current.widgets.find((widget) => widget.id === timer.id),
  );
  if (!instance) return null;
  const config = instance.config as {
    theme?: string;
    frostedGlass?: boolean;
    glassOpacity?: number;
  };
  return (
    <ThemePicker
      instanceId={instance.id}
      currentTheme={config.theme}
      timerGlass={{ enabled: config.frostedGlass ?? false, opacity: config.glassOpacity }}
    />
  );
}

describe('Timer theme popover', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      current: { ...state.current, widgets: [{ ...timer, config: { ...timer.config } }] },
    }));
  });

  it('persists the opt-in and opacity, and closes after choosing a theme', async () => {
    const user = userEvent.setup();
    render(<ConnectedThemePicker />);
    await user.click(screen.getByRole('button', { name: 'Color theme' }));

    const glassToggle = screen.getByRole('checkbox', { name: 'Frosted glass' });
    const opacity = screen.getByRole('slider', { name: 'Glass opacity' });
    expect(glassToggle).not.toBeChecked();
    expect(opacity).toBeDisabled();
    expect(opacity).toHaveValue('75');

    await user.click(glassToggle);
    expect(opacity).toBeEnabled();
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({ frostedGlass: true });

    fireEvent.change(opacity, { target: { value: '45' } });
    await waitFor(() => expect(useAppStore.getState().current.widgets[0].config.glassOpacity).toBe(45));

    await user.click(screen.getByRole('button', { name: 'Sky' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sky' })).not.toBeInTheDocument());
    expect(useAppStore.getState().current.widgets[0].config).toMatchObject({
      theme: 'sky',
      frostedGlass: true,
      glassOpacity: 45,
    });
  });

  it('shows a finite default opacity for invalid stored values', async () => {
    useAppStore.setState((state) => ({
      current: {
        ...state.current,
        widgets: [{ ...timer, config: { theme: 'midnight', frostedGlass: true, glassOpacity: Number.NaN } }],
      },
    }));
    const user = userEvent.setup();
    render(<ConnectedThemePicker />);
    await user.click(screen.getByRole('button', { name: 'Color theme' }));

    expect(screen.getByRole('slider', { name: 'Glass opacity' })).toHaveValue('75');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('omits Timer glass controls when no Timer config is supplied', async () => {
    const user = userEvent.setup();
    render(<ThemePicker instanceId="clock-theme-test" currentTheme="default" />);
    await user.click(screen.getByRole('button', { name: 'Color theme' }));

    expect(screen.queryByRole('checkbox', { name: 'Frosted glass' })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'Glass opacity' })).not.toBeInTheDocument();
  });
});
