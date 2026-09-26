import type { WidgetType } from '../store/types';

// Video fills its tile with an opaque player; the demo also paints its own background.
export const supportsWidgetGlass = (type: WidgetType): boolean =>
  type !== 'video' && type !== 'demo';

export const DEFAULT_GLASS_OPACITY = 75;
export const MIN_GLASS_OPACITY = 20;
export const MAX_GLASS_OPACITY = 100;

export const normalizeGlassOpacity = (value: unknown): number => {
  const opacity = Number.isFinite(value)
    ? value as number
    : DEFAULT_GLASS_OPACITY;
  return Math.max(MIN_GLASS_OPACITY, Math.min(MAX_GLASS_OPACITY, opacity));
};

export const withAlpha = (hex: string, opacity: number): string => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return hex;
  const [, red, green, blue] = match;
  return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${opacity / 100})`;
};
