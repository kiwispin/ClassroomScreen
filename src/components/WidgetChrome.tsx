import { Trash2 } from 'lucide-react';
import type { WidgetInstance } from '../store/types';
import { useAppStore } from '../store/store';
import { getWidgetMeta } from '../widgets/registry';

export default function WidgetChrome({ instance }: { instance: WidgetInstance }) {
  const removeWidget = useAppStore((s) => s.removeWidget);
  const meta = getWidgetMeta(instance.type);

  let SettingsBtn: React.ReactNode = null;
  if (meta?.Settings) {
    const Settings = meta.Settings;
    SettingsBtn = <Settings instance={instance} />;
  }

  // Outer wrapper is always interactive: it acts as a hover bridge so the
  // mouse can travel from the tile up to the chrome without passing through
  // a "dead" zone that fades the chrome out.
  // Named group `chrome` keeps the chrome visible while the mouse is inside
  // the wrapper itself (covers the gap + the visible pill).
  return (
    <div
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-[110] pb-3 group/chrome"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={
          'bg-white/95 backdrop-blur shadow-md rounded-full border border-slate-200/80 px-1.5 py-1 flex items-center gap-0.5 ' +
          'opacity-0 pointer-events-none transition-opacity duration-150 ' +
          'group-hover:opacity-100 group-hover:pointer-events-auto ' +
          'group-hover/chrome:opacity-100 group-hover/chrome:pointer-events-auto'
        }
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeWidget(instance.id);
          }}
          className="h-7 w-7 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors"
          aria-label={`Remove ${meta?.label ?? 'widget'}`}
          title="Remove"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
        {SettingsBtn}
      </div>
    </div>
  );
}
