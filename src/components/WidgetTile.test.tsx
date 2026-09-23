import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WidgetInstance } from '../store/types';
import WidgetTile from './WidgetTile';

vi.mock('../widgets/registry', () => ({
  getWidgetComponent: () => function MockWidget() { return <span>Tile content</span>; },
  getWidgetMeta: () => ({ label: 'Mock widget' }),
}));

const makeWidget = (type: WidgetInstance['type'], config: Record<string, unknown>): WidgetInstance => ({
  id: `${type}-tile-test`,
  type,
  position: { x: 0, y: 0 },
  size: { width: 480, height: 200 },
  zIndex: 1,
  config,
});

const renderedTile = () => screen.getByText('Tile content').parentElement as HTMLElement;

describe('WidgetTile backgrounds', () => {
  it('applies opacity and blur to the Timer background without fading its content', () => {
    const { rerender } = render(<WidgetTile instance={makeWidget('timer', {
      theme: 'midnight',
      frostedGlass: true,
      glassOpacity: 50,
    })} />);

    const tile = renderedTile();
    expect(tile.style.backgroundColor).toBe('rgba(15, 23, 42, 0.5)');
    expect(tile.style.backdropFilter).toBe('blur(12px)');
    expect(tile.style.opacity).toBe('');
    expect(screen.getByText('Tile content').style.opacity).toBe('');

    rerender(<WidgetTile instance={makeWidget('timer', {
      theme: 'midnight',
      frostedGlass: false,
      glassOpacity: 50,
    })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgb(15, 23, 42)');
    expect(renderedTile().style.backdropFilter).toBe('');
    expect(renderedTile().style.opacity).toBe('');
  });

  it('keeps legacy Timer configs opaque and ignores glass fields on other widgets', () => {
    const { rerender } = render(<WidgetTile instance={makeWidget('timer', { theme: 'midnight' })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgb(15, 23, 42)');
    expect(renderedTile().style.backdropFilter).toBe('');

    rerender(<WidgetTile instance={makeWidget('clock', {
      theme: 'default',
      frostedGlass: true,
      glassOpacity: 50,
    })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(renderedTile().style.backdropFilter).toBe('');
  });

  it('clamps imported opacity and falls back for non-finite values', () => {
    const { rerender } = render(<WidgetTile instance={makeWidget('timer', {
      theme: 'midnight', frostedGlass: true, glassOpacity: 0,
    })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgba(15, 23, 42, 0.2)');

    rerender(<WidgetTile instance={makeWidget('timer', {
      theme: 'midnight', frostedGlass: true, glassOpacity: 150,
    })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgb(15, 23, 42)');

    rerender(<WidgetTile instance={makeWidget('timer', {
      theme: 'midnight', frostedGlass: true, glassOpacity: Number.NaN,
    })} />);
    expect(renderedTile().style.backgroundColor).toBe('rgba(15, 23, 42, 0.75)');
  });
});
