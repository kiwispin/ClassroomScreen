import type { ReactNode } from 'react';
import type { WidgetInstance } from '../store/types';
import { getWidgetComponent, getWidgetMeta } from '../widgets/registry';
import { useAppStore } from '../store/store';

export default function WidgetTile({ instance }: { instance: WidgetInstance }) {
  const removeWidget = useAppStore((s) => s.removeWidget);
  const Component = getWidgetComponent(instance.type);
  const meta = getWidgetMeta(instance.type);

  if (!Component || !meta) {
    return (
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2">
        Unknown widget: {instance.type}
      </div>
    );
  }

  let header: ReactNode = null;
  if (meta.Settings) {
    const Settings = meta.Settings;
    header = <Settings instance={instance} />;
  }

  return (
    <div className="h-full w-full flex flex-col rounded-lg shadow bg-white overflow-hidden group relative">
      <div className="absolute top-0 left-0 right-0 h-7 px-2 flex items-center justify-between bg-slate-50/95 text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move z-10">
        <span>{meta.label}</span>
        <div className="flex items-center gap-1">
          {header}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(instance.id);
            }}
            className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center"
            aria-label={`Remove ${meta.label}`}
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Component instance={instance} />
      </div>
    </div>
  );
}
