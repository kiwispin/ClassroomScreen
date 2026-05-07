import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, MousePointer2, Pencil } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';
import SettingsPopover from './SettingsPopover';

const IDLE_MS = 4_000;

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const pinned = useAppStore((s) => s.toolbarPinned);

  const { primary, secondary } = useMemo(() => ({
    primary: allWidgets.filter((w) => !w.secondary),
    secondary: allWidgets.filter((w) => w.secondary),
  }), []);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (pinned) {
      setVisible(true);
      return;
    }
    let timer: number | null = null;
    const arm = () => {
      if (timer) window.clearTimeout(timer);
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), IDLE_MS);
    };
    const onMove = () => arm();
    const onKey = () => arm();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    arm();
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  return (
    <div
      className={
        'fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-5 pointer-events-none transition-transform duration-200 ' +
        (visible ? 'translate-y-0' : 'translate-y-[120%]')
      }
    >
      <div
        className="toolbar-scroll pointer-events-auto flex max-w-[calc(100vw-48px)] items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.46),0_2px_10px_-5px_rgba(15,23,42,0.25)] backdrop-blur-xl"
      >
        <div className="mr-2 flex h-[96px] w-16 shrink-0 flex-col items-center justify-center gap-2 border-r border-slate-200/90 pr-3">
          <button
            type="button"
            title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
            aria-label={annotateOpen ? 'Exit annotate' : 'Toggle annotate'}
            onClick={toggleAnnotate}
            className={
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors ' +
              (annotateOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950')
            }
          >
            <span className="relative block h-7 w-7">
              <span className="absolute bottom-0 left-0 h-2 w-3 rounded-sm bg-pink-300" aria-hidden />
              <Pencil className="relative z-10 h-7 w-7 text-slate-950" strokeWidth={2.25} />
            </span>
          </button>
          <button
            type="button"
            title="Select"
            aria-label="Select"
            onClick={() => {
              if (annotateOpen) toggleAnnotate();
            }}
            className={
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors ' +
              (!annotateOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950')
            }
          >
            <span className="relative block h-7 w-7">
              <span className="absolute bottom-0 left-0 h-3 w-3 rounded bg-indigo-100" aria-hidden />
              <MousePointer2 className="relative z-10 h-7 w-7 text-indigo-600" strokeWidth={2.25} />
            </span>
          </button>
        </div>
        <BackgroundPicker />
        {primary.map((w) => (
          <ToolButton
            key={w.type}
            Icon={w.Icon}
            label={w.label.toLowerCase()}
            title={`Add ${w.label}`}
            iconColor={w.iconColor}
            onClick={() => addWidget(w.type)}
          />
        ))}
        {secondary.length > 0 && (
          <SettingsPopover
            title="Edit widget bar"
            arrow
            panelClassName="overflow-visible p-0"
            trigger={(open, popoverOpen) => (
              <ToolButton
                Icon={LayoutGrid}
                label="more"
                title={`More widgets (${secondary.length})`}
                active={popoverOpen}
                onClick={open}
              />
            )}
          >
            {(close) => (
              <div className="grid w-[min(34rem,calc(100vw-32px))] grid-cols-3 gap-x-4 gap-y-2 px-6 py-7 sm:grid-cols-4">
                {secondary.map((w) => (
                  <ToolButton
                    key={w.type}
                    Icon={w.Icon}
                    label={w.label.toLowerCase()}
                    title={`Add ${w.label}`}
                    iconColor={w.iconColor}
                    variant="popover"
                    onClick={() => {
                      addWidget(w.type);
                      close();
                    }}
                  />
                ))}
              </div>
            )}
          </SettingsPopover>
        )}
        <div className="mx-1 h-14 w-px shrink-0 bg-slate-200/90" />
        <PresetMenu />
      </div>
    </div>
  );
}
