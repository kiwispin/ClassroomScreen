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
});
