import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useAppStore } from '../store/store';
import type { WidgetType } from '../store/types';
import { getWidgetMeta } from './registry';

function ConnectedSettings() {
  const instance = useAppStore((state) => state.current.widgets[0]);
  const Settings = getWidgetMeta(instance.type)!.Settings!;
  return <Settings instance={instance} />;
}

function setup(type: WidgetType, config: Record<string, unknown> = {}) {
  useAppStore.setState((state) => ({ current: { ...state.current, widgets: [{
    id: 'settings-review', type, position: { x: 0, y: 0 },
    size: { width: 300, height: 250 }, zIndex: 1, config,
  }] } }));
  render(<ConnectedSettings />);
  return userEvent.setup();
}

const config = () => useAppStore.getState().current.widgets[0].config;

describe('Migrated widget settings', () => {
  it.each([
    ['calendar', 'Calendar'], ['dice', 'Dice'], ['image', 'Image'],
    ['namepicker', 'Name picker'], ['noisemeter', 'Noise meter'],
    ['notepad', 'Notepad'], ['qrcode', 'QR'], ['video', 'Video'],
  ] as const)('%s opens a named panel and restores focus on close', async (type, title) => {
    const user = setup(type);
    const trigger = screen.getByRole('button', { name: `${title} settings` });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: `${title} settings` })).toBeVisible();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('preserves name-picker history until removal is disabled', async () => {
    const user = setup('namepicker', { namesText: 'Alice\nBob', removePicked: true, picked: ['Alice'] });
    await user.click(screen.getByRole('button', { name: 'Name picker settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'Remove a name after picking' }));
    expect(config()).toMatchObject({ namesText: 'Alice\nBob', removePicked: false, picked: [] });
  });

  it('enables the manual font-size slider only when auto-fit is off', async () => {
    const user = setup('notepad', { autoFit: true, fontSize: 24 });
    await user.click(screen.getByRole('button', { name: 'Notepad settings' }));
    const slider = screen.getByRole('slider', { name: 'Font size' });
    expect(slider).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Auto-fit text' }));
    expect(slider).toBeEnabled();
    fireEvent.change(slider, { target: { value: '32' } });
    expect(config()).toMatchObject({ autoFit: false, fontSize: 32 });
  });

  it('keeps dice presets and custom range editing connected', async () => {
    const user = setup('dice', { mode: 'dice', count: 2 });
    await user.click(screen.getByRole('button', { name: 'Dice settings' }));
    await user.click(screen.getByRole('button', { name: '1 to 100' }));
    expect(screen.getByRole('button', { name: '1 to 100' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Min' }), { target: { value: '-10' } });
    expect(config()).toMatchObject({ mode: 'range', min: -10, max: 100 });
  });
});

