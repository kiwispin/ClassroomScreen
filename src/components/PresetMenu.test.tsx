import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN, type Preset } from '../store/types';
import PresetMenu from './PresetMenu';
import PresetNavigation from './PresetNavigation';
import ScheduleEditor from './ScheduleEditor';

const makePreset = (id: string, name: string): Preset => ({ id, name, state: { ...DEFAULT_SCREEN, widgets: [] }, createdAt: 1, updatedAt: 1 });
beforeEach(() => useAppStore.setState({ presets: [makePreset('a', 'Reading'), makePreset('b', 'Maths')], current: { ...DEFAULT_SCREEN, widgets: [] }, activePresetId: 'a', schedule: [], scheduleEnabled: false }));

describe('Saved screens', () => {
  it('duplicates independently, reorders without changing IDs, and persists order', () => {
    useAppStore.getState().duplicatePreset('a');
    let presets = useAppStore.getState().presets;
    expect(presets.map((p) => p.name)).toEqual(['Reading', 'Reading (copy)', 'Maths']);
    expect(presets[1].state).not.toBe(presets[0].state);
    const copyId = presets[1].id;
    useAppStore.getState().movePreset(copyId, 1);
    presets = useAppStore.getState().presets;
    expect(presets.map((p) => p.id)).toEqual(['a', 'b', copyId]);
    expect(JSON.parse(localStorage.getItem('classroomscreen-state')!).state.presets.map((p: Preset) => p.id)).toEqual(['a', 'b', copyId]);
    useAppStore.getState().movePreset(copyId, 1);
    expect(useAppStore.getState().presets).toBe(presets);
    expect(useAppStore.getState().activePresetId).toBe('a');
  });

  it('opens cards, supports search and duplication, and closes only the nested rename dialog on Escape', async () => {
    const user = userEvent.setup();
    render(<PresetMenu />);
    await user.click(screen.getByRole('button', { name: 'Reading' }));
    expect(screen.getByRole('button', { name: 'Open Reading' })).toHaveAttribute('aria-current', 'true');
    await user.click(screen.getByRole('button', { name: 'Duplicate Reading' }));
    expect(screen.getByRole('button', { name: 'Open Reading (copy)' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Rename Maths' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Rename preset' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Saved screens' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Rename Maths' })).toHaveFocus();
    await user.type(screen.getByRole('searchbox'), 'Maths');
    expect(screen.queryByRole('button', { name: 'Open Reading' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Maths' })).toBeVisible();
  });

  it('offers cancel, discard, and save when navigating an edited screen', async () => {
    useAppStore.getState().setBackground({ kind: 'solid', color: '#ffffff' });
    const user = userEvent.setup();
    render(<PresetNavigation />);
    expect(screen.getByRole('button', { name: 'Previous screen' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next screen' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().activePresetId).toBe('a');
    await user.click(screen.getByRole('button', { name: 'Next screen' }));
    await user.click(screen.getByRole('button', { name: 'Save and switch' }));
    expect(useAppStore.getState().presets[0].state.background).toEqual({ kind: 'solid', color: '#ffffff' });
    expect(useAppStore.getState().activePresetId).toBe('b');
    expect(screen.getByRole('button', { name: 'Next screen' })).toBeDisabled();
    useAppStore.getState().setBackground({ kind: 'solid', color: '#000000' });
    await user.click(screen.getByRole('button', { name: 'Previous screen' }));
    await user.click(screen.getByRole('button', { name: 'Switch without saving' }));
    expect(useAppStore.getState().presets[1].state.background).toEqual(DEFAULT_SCREEN.background);
    expect(useAppStore.getState().activePresetId).toBe('a');
  });

  it('removes schedules for a deleted preset without changing the current screen', () => {
    useAppStore.getState().addScheduleRule({ presetId: 'a', daysOfWeek: [1], startTime: '09:00' });
    const current = useAppStore.getState().current;
    useAppStore.getState().deletePreset('a');
    expect(useAppStore.getState().schedule).toEqual([]);
    expect(useAppStore.getState().current).toBe(current);
  });

  it('edits labelled schedule controls and reports overlapping rules', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor open onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.getAllByRole('status')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Time for rule 2'), { target: { value: '10:30' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Screen for rule 2'), 'b');
    await user.click(screen.getByRole('button', { name: 'Mon for rule 2' }));
    expect(useAppStore.getState().schedule[1]).toMatchObject({ presetId: 'b', startTime: '10:30', daysOfWeek: [2, 3, 4, 5] });
    await user.click(within(screen.getByRole('dialog')).getByRole('checkbox'));
    expect(useAppStore.getState().scheduleEnabled).toBe(true);
  });
});
