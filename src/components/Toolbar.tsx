import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';
import { useFullscreen } from '../lib/useFullscreen';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const { isFs, toggle: toggleFs } = useFullscreen();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl shadow-lg border border-slate-200 bg-white/95 backdrop-blur px-2 py-1.5 flex items-center gap-1 max-w-[calc(100vw-24px)] overflow-x-auto">
        {allWidgets.map((w) => (
          <ToolButton
            key={w.type}
            icon={w.icon}
            label={w.label.toLowerCase()}
            title={`Add ${w.label}`}
            onClick={() => addWidget(w.type)}
          />
        ))}
        <div className="shrink-0 w-px h-10 bg-slate-200 mx-0.5" />
        <ToolButton
          icon="✏️"
          label="annotate"
          title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
          active={annotateOpen}
          onClick={toggleAnnotate}
        />
        <ToolButton
          icon={isFs ? '🗗' : '⛶'}
          label="fullscreen"
          title={isFs ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          active={isFs}
          onClick={toggleFs}
        />
        <div className="shrink-0 w-px h-10 bg-slate-200 mx-0.5" />
        <PresetMenu />
        <BackgroundPicker />
      </div>
    </div>
  );
}
