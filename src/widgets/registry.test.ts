import { describe, it, expect } from 'vitest';
import { getWidgetMeta, getWidgetComponent, allWidgets } from './registry';

describe('widget registry', () => {
  it('lists at least one widget', () => {
    expect(allWidgets.length).toBeGreaterThan(0);
  });

  it('returns metadata for the demo widget', () => {
    const meta = getWidgetMeta('demo');
    expect(meta).toBeDefined();
    expect(meta?.type).toBe('demo');
    expect(meta?.label).toBe('Demo');
  });

  it('returns a component for the demo widget', () => {
    const C = getWidgetComponent('demo');
    expect(typeof C).toBe('function');
  });

  it('returns undefined for an unknown widget type', () => {
    // @ts-expect-error - intentionally invalid for test
    expect(getWidgetMeta('does-not-exist')).toBeUndefined();
  });
});
