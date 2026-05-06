import type { WidgetInstance } from '../store/types';
import { getWidgetComponent, getWidgetMeta } from '../widgets/registry';

export default function WidgetTile({ instance }: { instance: WidgetInstance }) {
  const Component = getWidgetComponent(instance.type);
  const meta = getWidgetMeta(instance.type);

  if (!Component || !meta) {
    return (
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2 rounded-xl">
        Unknown widget: {instance.type}
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl shadow-md ring-1 ring-slate-200/70 bg-white overflow-hidden">
      <Component instance={instance} />
    </div>
  );
}
