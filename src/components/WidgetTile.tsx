import type { CSSProperties } from 'react';
import type { WidgetInstance } from '../store/types';
import { getWidgetComponent, getWidgetMeta } from '../widgets/registry';
import { getTheme } from '../lib/themes';
import { normalizeGlassOpacity, withAlpha } from '../lib/widget-glass';

export default function WidgetTile({ instance }: { instance: WidgetInstance }) {
  const Component = getWidgetComponent(instance.type);
  const meta = getWidgetMeta(instance.type);
  const config = instance.config as {
    theme?: string;
    frostedGlass?: boolean;
    glassOpacity?: number;
  };
  const themeId = config.theme;
  const theme = getTheme(themeId);

  if (!Component || !meta) {
    return (
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2 rounded-xl">
        Unknown widget: {instance.type}
      </div>
    );
  }

  const glassEnabled =
    (instance.type === 'timer' || instance.type === 'clock') && config.frostedGlass === true;
  const glassOpacity = normalizeGlassOpacity(config.glassOpacity);
  const tileBackground = glassEnabled ? withAlpha(theme.bg, glassOpacity) : theme.bg;

  const tileStyle: CSSProperties & Record<`--${string}`, string> = {
    background: tileBackground,
    color: theme.text,
    '--w-bg': tileBackground,
    '--w-text': theme.text,
    '--w-accent': theme.accent,
    ...(glassEnabled ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
  };

  return (
    <div
      className="h-full w-full rounded-xl shadow-md ring-1 ring-slate-200/70 overflow-hidden transition-shadow group-hover:ring-2 group-hover:ring-indigo-400"
      style={tileStyle}
    >
      <Component instance={instance} />
    </div>
  );
}
