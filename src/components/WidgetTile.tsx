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

  return (
    <div className="h-full w-full flex flex-col rounded-lg shadow bg-white overflow-hidden group">
      <div className="h-7 px-2 flex items-center justify-between bg-slate-50 text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move">
        <span>{meta.label}</span>
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
      <div className="flex-1 min-h-0">
        <Component instance={instance} />
      </div>
    </div>
  );
}
