export type WidgetTheme = {
  id: string;
  name: string;
  bg: string;     // CSS color
  text: string;   // CSS color (primary text inside the tile)
  accent: string; // CSS color (used by buttons/highlights via --w-accent)
};

export const THEMES: WidgetTheme[] = [
  // Light + accent variants
  { id: 'default',  name: 'Default',  bg: '#ffffff', text: '#0f172a', accent: '#6366f1' },
  { id: 'mint',     name: 'Mint',     bg: '#ecfdf5', text: '#064e3b', accent: '#10b981' },
  { id: 'sky',      name: 'Sky',      bg: '#f0f9ff', text: '#0c4a6e', accent: '#0ea5e9' },
  { id: 'lavender', name: 'Lavender', bg: '#f5f3ff', text: '#4c1d95', accent: '#8b5cf6' },
  { id: 'peach',    name: 'Peach',    bg: '#fff7ed', text: '#7c2d12', accent: '#f97316' },
  { id: 'rose',     name: 'Rose',     bg: '#fff1f2', text: '#881337', accent: '#f43f5e' },
  { id: 'pink',     name: 'Pink',     bg: '#fdf2f8', text: '#831843', accent: '#ec4899' },
  { id: 'lemon',    name: 'Lemon',    bg: '#fefce8', text: '#713f12', accent: '#eab308' },

  // Saturated
  { id: 'sunshine', name: 'Sunshine', bg: '#fde68a', text: '#1e293b', accent: '#b45309' },
  { id: 'salmon',   name: 'Salmon',   bg: '#fecaca', text: '#7f1d1d', accent: '#dc2626' },
  { id: 'sage',     name: 'Sage',     bg: '#bbf7d0', text: '#14532d', accent: '#15803d' },
  { id: 'cobalt',   name: 'Cobalt',   bg: '#1e3a8a', text: '#dbeafe', accent: '#fbbf24' },
  { id: 'lilac',    name: 'Lilac',    bg: '#6d28d9', text: '#ede9fe', accent: '#fde047' },

  // Dark
  { id: 'forest',   name: 'Forest',   bg: '#14532d', text: '#dcfce7', accent: '#fde047' },
  { id: 'navy',     name: 'Navy',     bg: '#1e293b', text: '#cbd5e1', accent: '#fb923c' },
  { id: 'midnight', name: 'Midnight', bg: '#0f172a', text: '#e2e8f0', accent: '#a78bfa' },
];

export const DEFAULT_THEME = THEMES[0];

export const getTheme = (id: string | undefined): WidgetTheme =>
  THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
