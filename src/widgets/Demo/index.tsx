import type { WidgetInstance } from '../../store/types';

export default function DemoWidget({ instance }: { instance: WidgetInstance }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white text-slate-600 text-sm">
      Demo widget · {instance.id.slice(0, 6)}
    </div>
  );
}
