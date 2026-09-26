import type { ScreenState } from '../store/types';
import BackgroundLayer from '../overlays/Background';
import { getTheme } from '../lib/themes';
import { getWidgetMeta } from '../widgets/registry';

// A static layout preview: never mount live timers, microphones, or videos in cards.
export default function PresetPreview({ state }: { state: ScreenState }) {
  const width = Math.max(1280, ...state.widgets.map((w) => w.position.x + w.size.width + 32));
  const height = Math.max(720, ...state.widgets.map((w) => w.position.y + w.size.height + 32));
  return <div aria-hidden="true" className="relative aspect-video overflow-hidden rounded-md border border-slate-200">
    <BackgroundLayer bg={state.background} />
    {[...state.widgets].sort((a, b) => a.zIndex - b.zIndex).map((w) => {
      const theme = getTheme(w.config.theme as string | undefined);
      const meta = getWidgetMeta(w.type);
      const Icon = meta?.Icon;
      return <div key={w.id} className="absolute flex flex-col items-center justify-center overflow-hidden rounded-sm p-0.5 shadow-sm"
        style={{ left: `${w.position.x / width * 100}%`, top: `${w.position.y / height * 100}%`, width: `${w.size.width / width * 100}%`, height: `${w.size.height / height * 100}%`, background: theme.bg, color: theme.text }}>
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        <span className="max-w-full truncate text-[7px] leading-tight">{w.type === 'notepad' ? String(w.config.text || 'Notepad') : meta?.label}</span>
      </div>;
    })}
  </div>;
}
