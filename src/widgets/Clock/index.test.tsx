import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { WidgetInstance } from '../../store/types';
import Clock from './index';

const makeClock = (config: Record<string, unknown>): WidgetInstance => ({
  id: 'clock-layout-test',
  type: 'clock',
  position: { x: 0, y: 0 },
  size: { width: 280, height: 140 },
  zIndex: 1,
  config,
});

describe('Clock layout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 23, 21, 42, 20));
  });

  afterEach(() => vi.useRealTimers());

  it('keeps 12-hour seconds and the meridiem together on one line', () => {
    const { container } = render(<Clock instance={makeClock({
      format24: false,
      showSeconds: true,
      showDate: true,
    })} />);

    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute('aria-label', '09:42:20 PM');
    expect(time).toHaveClass('whitespace-nowrap');
    expect(time?.textContent).toBe('09:42:20PM');
    expect(screen.getByText(/September/)).toHaveClass('max-w-full', 'break-words');
  });

  it('reserves legible date space beneath the analog face', () => {
    const { container } = render(<Clock instance={makeClock({
      analog: true,
      showSeconds: true,
      showDate: true,
    })} />);

    const root = container.firstElementChild as HTMLElement;
    const face = root.firstElementChild as HTMLElement;
    const date = root.lastElementChild as HTMLElement;
    expect(face).toHaveClass('w-[min(86cqi,68cqb)]', 'h-[min(86cqi,68cqb)]', 'shrink-0');
    expect(date).toHaveClass('max-w-full', 'break-words', 'leading-tight');
    expect(date).toHaveClass('text-[clamp(8px,min(4cqi,9cqb),22px)]');
    expect(container.querySelector('svg line[style]')).not.toBeNull();
  });

  it('lets the analog face use its space when the date is hidden', () => {
    const { container } = render(<Clock instance={makeClock({
      analog: true,
      showDate: false,
    })} />);

    const face = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(face).toHaveClass('w-[min(86cqi,86cqb)]', 'h-[min(86cqi,86cqb)]');
    expect(screen.queryByText(/September/)).not.toBeInTheDocument();
  });
});
