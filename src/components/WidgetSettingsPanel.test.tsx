import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';
import WidgetSettingsPanel from './WidgetSettingsPanel';

function Harness({ shortcut }: { shortcut: () => void }) {
  useGlobalShortcuts({ z: shortcut, Escape: shortcut });
  return (
    <WidgetSettingsPanel
      title="Timer settings"
      trigger={(toggle, open, panelId) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
        >
          Open settings
        </button>
      )}
    >
      {() => (
        <label>
          <input type="radio" name="choice" />
          Choice
        </label>
      )}
    </WidgetSettingsPanel>
  );
}

describe('WidgetSettingsPanel', () => {
  it('scopes shortcuts, closes on Escape, and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    const shortcut = vi.fn();
    render(<Harness shortcut={shortcut} />);

    const trigger = screen.getByRole('button', { name: 'Open settings' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Timer settings' });
    const close = screen.getByRole('button', { name: 'Close settings' });
    await waitFor(() => expect(close).toHaveFocus());

    await user.keyboard('z');
    expect(shortcut).not.toHaveBeenCalled();

    await user.click(screen.getByRole('radio', { name: 'Choice' }));
    await user.keyboard('z');
    expect(shortcut).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(shortcut).not.toHaveBeenCalled();
    expect(dialog).not.toBeInTheDocument();
  });
});
