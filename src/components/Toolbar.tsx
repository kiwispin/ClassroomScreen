import { useMemo } from 'react';
import { LayoutGrid, Minimize2, MousePointer2, Pencil } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import AnnotateToolBar from '../overlays/Annotate/ToolBar';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';
import SettingsPopover from './SettingsPopover';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const hidden = useAppStore((s) => s.toolbarHidden ?? false);
  const hideToolbar = useAppStore((s) => s.hideToolbar);

  const { primary, secondary } = useMemo(() => ({
    primary: allWidgets.filter((w) => !w.secondary),
    secondary: allWidgets.filter((w) => w.secondary),
  }), []);

  return (
    <div
      className={
        'fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3 pointer-events-none transition-transform duration-200 ' +
        (!hidden ? 'translate-y-0' : 'translate-y-[120%]')
      }
    >
      <div
        className="toolbar-scroll pointer-events-auto flex max-w-[calc(100vw-48px)] items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.46),0_2px_10px_-5px_rgba(15,23,42,0.25)] backdrop-blur-xl"
      >
        <div className="mr-2 flex h-[78px] w-14 shrink-0 flex-col items-center justify-center gap-1.5 border-r border-slate-200/90 pr-3">
          <button
            type="button"
            title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
            aria-label={annotateOpen ? 'Exit annotate' : 'Toggle annotate'}
            onClick={toggleAnnotate}
            className={
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors ' +
              (annotateOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950')
            }
          >
            <span className="relative block h-6 w-6">
              <span className="absolute bottom-0 left-0 h-1.5 w-2.5 rounded-sm bg-pink-300" aria-hidden />
              <Pencil className="relative z-10 h-6 w-6 text-slate-950" strokeWidth={2.2} />
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
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors ' +
              (!annotateOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950')
            }
          >
            <span className="relative block h-6 w-6">
              <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded bg-indigo-100" aria-hidden />
              <MousePointer2 className="relative z-10 h-6 w-6 text-indigo-600" strokeWidth={2.2} />
            </span>
          </button>
        </div>
        {annotateOpen ? (
          <AnnotateToolBar />
        ) : (
          <>
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
                  <div className="grid w-[min(30rem,calc(100vw-32px))] grid-cols-3 gap-x-3 gap-y-1 px-5 py-5 sm:grid-cols-4">
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
            <div className="mx-1 h-12 w-px shrink-0 bg-slate-200/90" />
            <PresetMenu />
            <div className="mx-1 h-12 w-px shrink-0 bg-slate-200/90" />
            <button
              type="button"
              onClick={hideToolbar}
              title="Hide bar (B)"
              aria-label="Hide bar"
              className="group flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 transition-colors hover:bg-slate-200/80 hover:text-slate-950"
            >
              <Minimize2
                className="h-7 w-7"
                strokeWidth={2.3}
                style={{
                  stroke: 'url(#grad-slate)',
                  filter: 'drop-shadow(0 1px 0 rgba(15,23,42,0.08))',
                }}
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
