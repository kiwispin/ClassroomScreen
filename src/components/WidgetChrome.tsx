import { Trash2, MoreHorizontal, Lock, Unlock, Copy, GripVertical } from 'lucide-react';
import type { WidgetInstance } from '../store/types';
import { useAppStore } from '../store/store';
import { getWidgetMeta } from '../widgets/registry';
import ThemePicker from './ThemePicker';
import WidgetSettingsPanel, { SettingsSection } from './WidgetSettingsPanel';
import { screenButton } from './ScreenDialog';
import { supportsWidgetGlass } from '../lib/widget-glass';

export default function WidgetChrome({ instance }: { instance: WidgetInstance }) {
  const removeWidget = useAppStore((s) => s.removeWidget);
  const toggleLock = useAppStore((s) => s.toggleWidgetLock);
  const duplicate = useAppStore((s) => s.duplicateWidget);
  const meta = getWidgetMeta(instance.type);
  const config = instance.config as {
    theme?: string;
    frostedGlass?: boolean;
    glassOpacity?: number;
  };
  const currentTheme = config.theme;

  let SettingsBtn: React.ReactNode = null;
  if (meta?.Settings) {
    const Settings = meta.Settings;
    SettingsBtn = <Settings instance={instance} />;
  }

  return (
    <div
      className={`absolute ${instance.position.y < 40 ? 'top-0' : '-top-10'} -translate-x-1/2 z-[110] pb-3 group/chrome`}
      style={{ left: `clamp(${84 - instance.position.x}px, 50%, calc(100vw - ${instance.position.x + 84}px))` }}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('[data-widget-drag]')) e.stopPropagation(); }}
    >
      <div
        className={
          'bg-white/95 backdrop-blur shadow-md rounded-full border border-slate-200/80 px-1.5 py-1 flex items-center gap-0.5 ' +
          'opacity-0 pointer-events-none transition-opacity duration-150 ' +
          'group-hover:opacity-100 group-hover:pointer-events-auto ' +
          'group-hover/chrome:opacity-100 group-hover/chrome:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
        }
      >
        {!instance.locked && <span data-widget-drag title="Drag widget" className="cursor-grab px-1 text-slate-400"><GripVertical className="h-4 w-4" /></span>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeWidget(instance.id);
          }}
          className="h-7 w-7 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={instance.locked}
          aria-label={`Remove ${meta?.label ?? 'widget'}`}
          title="Remove"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <ThemePicker
          instanceId={instance.id}
          currentTheme={currentTheme}
          glass={supportsWidgetGlass(instance.type) ? {
            enabled: config.frostedGlass ?? false,
            opacity: config.glassOpacity,
          } : undefined}
        />
        {SettingsBtn}
        <WidgetSettingsPanel title={`${meta?.label ?? 'Widget'} actions`} trigger={(toggle, open, panelId) => <button type="button" onClick={toggle} aria-label={`More ${meta?.label ?? 'widget'} actions`} aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" title="More actions" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">{instance.locked ? <Lock className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}</button>}>
          {(close) => <SettingsSection title="Layout">
            <button className={screenButton + ' w-full'} onClick={() => toggleLock(instance.id)}>{instance.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{instance.locked ? 'Unlock widget' : 'Lock widget'}</button>
            <p className="text-xs text-slate-500">Locking prevents moving, resizing, and deletion. Widget controls still work.</p>
            <button className={screenButton + ' w-full'} onClick={() => { duplicate(instance.id, { width: window.innerWidth, height: window.innerHeight }); close(); }}><Copy className="h-4 w-4" />Duplicate widget</button>
          </SettingsSection>}
        </WidgetSettingsPanel>
      </div>
    </div>
  );
}
