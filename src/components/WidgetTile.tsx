import type { CSSProperties } from 'react';
import type { WidgetInstance } from '../store/types';
import { getWidgetComponent, getWidgetMeta } from '../widgets/registry';
import { getTheme } from '../lib/themes';

export default function WidgetTile({ instance }: { instance: WidgetInstance }) {
  const Component = getWidgetComponent(instance.type);
  const meta = getWidgetMeta(instance.type);
  const themeId = (instance.config as { theme?: string }).theme;
  const theme = getTheme(themeId);

  if (!Component || !meta) {
    return (
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2 rounded-xl">
        Unknown widget: {instance.type}
      </div>
    );
  }

  const tileStyle: CSSProperties & Record<`--${string}`, string> = {
    background: theme.bg,
    color: theme.text,
    '--w-bg': theme.bg,
    '--w-text': theme.text,
    '--w-accent': theme.accent,
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
