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
      <div className="h-full w-full bg-red-100 text-red-700 text-xs p-2 rounded-xl">
        Unknown widget: {instance.type}
      </div>
    );
  }

  let settingsBtn: ReactNode = null;
  if (meta.Settings) {
    const Settings = meta.Settings;
    settingsBtn = <Settings instance={instance} />;
  }

  return (
    <div className="h-full w-full flex flex-col rounded-xl shadow-md ring-1 ring-slate-200/70 bg-white overflow-hidden group relative">
      <div className="absolute top-0 left-0 right-0 h-7 px-2 flex items-center justify-between bg-gradient-to-b from-white/95 to-white/70 backdrop-blur text-slate-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity drag-handle cursor-move z-10 select-none">
        <span className="font-medium tracking-wide uppercase">{meta.label}</span>
        <div className="flex items-center gap-0.5">
          {settingsBtn}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(instance.id);
            }}
            className="h-6 w-6 rounded-md hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800"
            aria-label={`Remove ${meta.label}`}
            title="Remove"
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
