import { useState } from 'react';
import { ChevronUp, LayoutGrid, Minimize2, MousePointer2, Pencil } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import { resolveToolbarWidgets } from '../lib/toolbar-preferences';
import BackgroundPicker from '../overlays/Background/Picker';
import AnnotateToolBar from '../overlays/Annotate/ToolBar';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';
import WidgetLibrary from './WidgetLibrary';
import BackgroundMusicControl from './BackgroundMusicControl';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const hidden = useAppStore((s) => s.toolbarHidden ?? false);
  const hideToolbar = useAppStore((s) => s.hideToolbar);
  const showToolbar = useAppStore((s) => s.showToolbar);
  const preference = useAppStore((s) => s.toolbarWidgets);
  const widgets = useAppStore((s) => s.current.widgets);
  const primary = resolveToolbarWidgets(preference, allWidgets);
  const [libraryOpen, setLibraryOpen] = useState(false);

  if (hidden) return <button type="button" onClick={showToolbar} aria-label="Show widget bar" title="Show widget bar (B)" className="fixed bottom-3 left-1/2 z-[300] flex h-11 w-14 -translate-x-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"><ChevronUp className="h-6 w-6" /></button>;

  return <>
    <nav aria-label="Widget bar" className="pointer-events-none fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3">
      <div className="pointer-events-auto flex max-w-[calc(100vw-24px)] items-center gap-1 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.46),0_2px_10px_-5px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="flex h-[88px] w-12 shrink-0 flex-col items-center justify-center gap-0 border-r border-slate-200/90 pr-1">
          <button
            type="button"
            title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
            aria-label={annotateOpen ? 'Exit annotate' : 'Toggle annotate'}
            onClick={toggleAnnotate}
            className={
              'flex h-11 w-11 items-center justify-center rounded-lg transition-colors ' +
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
              'flex h-11 w-11 items-center justify-center rounded-lg transition-colors ' +
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

        <div aria-label={annotateOpen ? 'Annotation tools' : 'Favourite widgets and screen tools'} tabIndex={0} className="flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500" style={{ scrollbarWidth: 'thin' }}>
          {annotateOpen ? <AnnotateToolBar /> : <>
            <BackgroundPicker />
            {primary.map((w) => <ToolButton key={w.type} Icon={w.Icon} label={w.label.toLowerCase()} title={`Add ${w.label}`} iconColor={w.iconColor} instanceCount={widgets.filter((instance) => instance.type === w.type).length} onClick={() => addWidget(w.type)} />)}
            <span className="mx-1 h-12 w-px shrink-0 bg-slate-200" />
            <BackgroundMusicControl />
            <PresetMenu />
          </>}
        </div>
        {!annotateOpen && <div className="shrink-0 border-l border-slate-200 pl-1"><ToolButton Icon={LayoutGrid} label="more" title="More widgets and edit widget bar" expanded={libraryOpen} onClick={() => setLibraryOpen(true)} /></div>}
        <button type="button" onClick={hideToolbar} title="Hide bar (B)" aria-label="Hide bar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"><Minimize2 className="h-5 w-5" /></button>
      </div>
    </nav>
    {libraryOpen && <WidgetLibrary onClose={() => setLibraryOpen(false)} />}
  </>;
}
