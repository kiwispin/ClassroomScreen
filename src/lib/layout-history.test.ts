import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/store';
import { DEFAULT_SCREEN, type WidgetInstance } from '../store/types';
import { widgetAssetIsShared } from './widget-asset-references';

const widget = (id: string, x = 20, y = 50): WidgetInstance => ({ id, type: 'notepad', position: { x, y }, size: { width: 200, height: 100 }, zIndex: 1, config: { text: 'Original', theme: 'midnight' } });
const state = () => useAppStore.getState();
beforeEach(() => useAppStore.setState({ current: { ...DEFAULT_SCREEN, widgets: [widget('a'), widget('b', 400, 200)] }, layoutPast: [], layoutFuture: [], selectedWidgetIds: [], presets: [], activePresetId: null, backgroundUploads: [] }));

describe('Widget layout actions', () => {
  it('undoes move and resize as one edit without reverting later text changes', () => {
    state().commitWidgetLayout('a', { x: 100, y: 120 }, { width: 300, height: 180 });
    state().updateWidgetConfig('a', { text: 'New text' });
    expect(state().layoutPast).toHaveLength(1);
    state().undoLayout();
    expect(state().current.widgets[0]).toMatchObject({ position: { x: 20, y: 50 }, size: { width: 200, height: 100 }, config: { text: 'New text' } });
    state().redoLayout();
    expect(state().current.widgets[0]).toMatchObject({ position: { x: 100, y: 120 }, size: { width: 300, height: 180 }, config: { text: 'New text' } });
  });

  it('protects locked widgets from moving, resizing and deletion while allowing controls', () => {
    state().toggleWidgetLock('a');
    state().commitWidgetLayout('a', { x: 999, y: 999 });
    state().updateWidgetPosition('a', 999, 999);
    state().updateWidgetSize('a', 999, 999);
    state().removeWidget('a');
    state().updateWidgetConfig('a', { text: 'Still editable' });
    expect(state().current.widgets[0]).toMatchObject({ locked: true, position: { x: 20, y: 50 }, size: { width: 200, height: 100 }, config: { text: 'Still editable' } });
    state().undoLayout();
    expect(state().current.widgets[0].locked).toBeUndefined();
  });

  it('duplicates independently with new identity, an offset and preserved settings', () => {
    state().toggleWidgetLock('a');
    state().duplicateWidget('a', { width: 800, height: 600 });
    const copy = state().current.widgets[2];
    expect(copy.id).not.toBe('a');
    expect(copy).toMatchObject({ locked: false, position: { x: 44, y: 74 }, config: { text: 'Original', theme: 'midnight' } });
    state().updateWidgetConfig(copy.id, { text: 'Copy only' });
    expect(state().current.widgets[0].config.text).toBe('Original');
    state().undoLayout();
    expect(state().current.widgets).toHaveLength(2);
    state().redoLayout();
    expect(state().current.widgets).toHaveLength(3);
  });

  it('copies timer settings without starting a second timer', () => {
    useAppStore.setState({ current: { ...DEFAULT_SCREEN, widgets: [{ ...widget('a'), type: 'timer', config: { fullDurationMs: 60000, durationMs: 30000, running: true, startedAt: 123, sfx: 'ding' } }] } });
    state().duplicateWidget('a');
    expect(state().current.widgets[1].config).toMatchObject({ fullDurationMs: 60000, durationMs: 60000, running: false, startedAt: null, sfx: 'ding' });
    expect(state().current.widgets[0].config.running).toBe(true);
  });

  it('aligns selected unlocked widgets as one reversible change', () => {
    useAppStore.setState((s) => ({ current: { ...s.current, widgets: [...s.current.widgets, { ...widget('c', 900, 300), locked: true }] } }));
    state().selectWidget('a'); state().selectWidget('b', true); state().selectWidget('c', true);
    state().alignSelectedWidgets('left');
    expect(state().current.widgets.map((w) => w.position.x)).toEqual([20, 20, 900]);
    expect(state().layoutPast).toHaveLength(1);
    state().undoLayout();
    expect(state().current.widgets.map((w) => w.position.x)).toEqual([20, 400, 900]);
  });

  it('restores a deleted widget and retains assets referenced by undo', () => {
    state().updateWidgetConfig('a', { imageId: 'shared-image' });
    state().removeWidget('a');
    expect(widgetAssetIsShared('shared-image', 'image', 'b')).toBe(true);
    state().undoLayout();
    expect(state().current.widgets.find((w) => w.id === 'a')?.config.imageId).toBe('shared-image');
  });

  it('does not delete uploads used by another copy', () => {
    state().updateWidgetConfig('a', { customSoundId: 'sound' });
    state().duplicateWidget('a');
    expect(widgetAssetIsShared('sound', 'audio', 'a')).toBe(true);
  });

  it('clears redo after a new layout edit and history when switching screens', () => {
    state().commitWidgetLayout('a', { x: 100, y: 100 }); state().undoLayout();
    state().commitWidgetLayout('a', { x: 200, y: 200 });
    expect(state().layoutFuture).toHaveLength(0);
    state().savePresetAs('Lesson');
    state().switchToPreset(state().presets[0].id);
    expect(state().layoutPast).toHaveLength(0);
    const saved = JSON.parse(localStorage.getItem('classroomscreen-state')!).state;
    expect(saved.layoutPast).toBeUndefined();
    expect(saved.selectedWidgetIds).toBeUndefined();
  });
});
