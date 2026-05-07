import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';
import { DEFAULT_SCREEN } from './types';

const reset = () =>
  useAppStore.setState({
    schemaVersion: 1,
    current: { ...DEFAULT_SCREEN, widgets: [] },
    presets: [],
    activePresetId: null,
    annotateOpen: false,
    annotateTool: 'pen',
    annotateColor: '#111827',
    annotateWidth: 5,
    annotateCanUndo: false,
    annotateUndoRequest: 0,
    annotateClearRequest: 0,
    toolbarPinned: false,
  });

describe('app store', () => {
  beforeEach(reset);

  it('starts with the default screen and no widgets', () => {
    const s = useAppStore.getState();
    expect(s.current.widgets).toEqual([]);
    expect(s.current.background).toEqual(DEFAULT_SCREEN.background);
  });

  it('addWidget appends a new instance with a generated id', () => {
    useAppStore.getState().addWidget('demo');
    const s = useAppStore.getState();
    expect(s.current.widgets).toHaveLength(1);
    expect(s.current.widgets[0].type).toBe('demo');
    expect(typeof s.current.widgets[0].id).toBe('string');
    expect(s.current.widgets[0].id.length).toBeGreaterThan(0);
  });

  it('addWidget assigns increasing zIndex', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().addWidget('demo');
    const ws = useAppStore.getState().current.widgets;
    expect(ws[1].zIndex).toBeGreaterThan(ws[0].zIndex);
  });

  it('removeWidget removes by id', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().removeWidget(id);
    expect(useAppStore.getState().current.widgets).toHaveLength(0);
  });

  it('updateWidgetPosition writes new x/y', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetPosition(id, 42, 99);
    const w = useAppStore.getState().current.widgets[0];
    expect(w.position).toEqual({ x: 42, y: 99 });
  });

  it('updateWidgetSize writes new width/height', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetSize(id, 300, 200);
    const w = useAppStore.getState().current.widgets[0];
    expect(w.size).toEqual({ width: 300, height: 200 });
  });

  it('focusWidget raises its zIndex above all others', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().addWidget('demo');
    const [a, b] = useAppStore.getState().current.widgets;
    useAppStore.getState().focusWidget(a.id);
    const updated = useAppStore.getState().current.widgets;
    const aZ = updated.find((w) => w.id === a.id)!.zIndex;
    const bZ = updated.find((w) => w.id === b.id)!.zIndex;
    expect(aZ).toBeGreaterThan(bZ);
  });

  it('updateWidgetConfig merges into the widget config', () => {
    useAppStore.getState().addWidget('demo');
    const id = useAppStore.getState().current.widgets[0].id;
    useAppStore.getState().updateWidgetConfig(id, { fontSize: 24 });
    const w = useAppStore.getState().current.widgets[0];
    expect(w.config).toEqual({ fontSize: 24 });

    useAppStore.getState().updateWidgetConfig(id, { color: 'red' });
    const w2 = useAppStore.getState().current.widgets[0];
    expect(w2.config).toEqual({ fontSize: 24, color: 'red' });
  });

  it('setBackground replaces the current background', () => {
    useAppStore.getState().setBackground({ kind: 'solid', color: '#000' });
    expect(useAppStore.getState().current.background).toEqual({
      kind: 'solid',
      color: '#000',
    });
  });

  it('toggleAnnotate flips the flag', () => {
    expect(useAppStore.getState().annotateOpen).toBe(false);
    useAppStore.getState().toggleAnnotate();
    expect(useAppStore.getState().annotateOpen).toBe(true);
    useAppStore.getState().toggleAnnotate();
    expect(useAppStore.getState().annotateOpen).toBe(false);
  });

  it('updates annotation controls', () => {
    useAppStore.getState().setAnnotateTool('eraser');
    useAppStore.getState().setAnnotateWidth(12);
    useAppStore.getState().setAnnotateColor('#ef4444');
    useAppStore.getState().setAnnotateCanUndo(true);
    useAppStore.getState().requestAnnotateUndo();
    useAppStore.getState().requestAnnotateClear();

    const s = useAppStore.getState();
    expect(s.annotateTool).toBe('pen');
    expect(s.annotateColor).toBe('#ef4444');
    expect(s.annotateWidth).toBe(12);
    expect(s.annotateCanUndo).toBe(true);
    expect(s.annotateUndoRequest).toBe(1);
    expect(s.annotateClearRequest).toBe(1);
  });

  it('savePresetAs creates a new preset from current state', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('Maths');
    const s = useAppStore.getState();
    expect(s.presets).toHaveLength(1);
    expect(s.presets[0].name).toBe('Maths');
    expect(s.presets[0].state.widgets).toHaveLength(1);
    expect(s.activePresetId).toBe(s.presets[0].id);
  });

  it('switchToPreset replaces current with a deep copy', () => {
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('A');
    const aId = useAppStore.getState().presets[0].id;

    useAppStore.getState().addWidget('demo');
    useAppStore.getState().savePresetAs('B');
    expect(useAppStore.getState().current.widgets).toHaveLength(2);

    useAppStore.getState().switchToPreset(aId);
    const s = useAppStore.getState();
    expect(s.current.widgets).toHaveLength(1);
    expect(s.activePresetId).toBe(aId);

    useAppStore.getState().addWidget('demo');
    expect(useAppStore.getState().current.widgets).toHaveLength(2);
    const presetA = useAppStore.getState().presets.find((p) => p.id === aId)!;
    expect(presetA.state.widgets).toHaveLength(1);
  });

  it('updateActivePreset writes current state into the active preset', () => {
    useAppStore.getState().savePresetAs('A');
    const aId = useAppStore.getState().presets[0].id;
    useAppStore.getState().addWidget('demo');
    useAppStore.getState().updateActivePreset();
    const a = useAppStore.getState().presets.find((p) => p.id === aId)!;
    expect(a.state.widgets).toHaveLength(1);
  });

  it('renamePreset changes the name', () => {
    useAppStore.getState().savePresetAs('A');
    const id = useAppStore.getState().presets[0].id;
    useAppStore.getState().renamePreset(id, 'Beta');
    expect(useAppStore.getState().presets[0].name).toBe('Beta');
  });

  it('deletePreset removes by id and clears activePresetId if matched', () => {
    useAppStore.getState().savePresetAs('A');
    const id = useAppStore.getState().presets[0].id;
    expect(useAppStore.getState().activePresetId).toBe(id);
    useAppStore.getState().deletePreset(id);
    expect(useAppStore.getState().presets).toHaveLength(0);
    expect(useAppStore.getState().activePresetId).toBeNull();
  });
});
