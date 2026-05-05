import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);

  return (
    <div className="absolute top-0 left-0 right-0 h-12 z-50 flex items-center gap-1 px-3 bg-white/90 backdrop-blur shadow-sm">
      {allWidgets.map((w) => (
        <button
          key={w.type}
          onClick={() => addWidget(w.type)}
          title={`Add ${w.label}`}
          className="h-9 w-9 rounded hover:bg-slate-100 flex items-center justify-center text-xl"
        >
          {w.icon}
        </button>
      ))}
      <button
        onClick={toggleAnnotate}
        title="Annotate"
        className={
          'h-9 px-3 rounded text-sm flex items-center gap-1 ' +
          (annotateOpen ? 'bg-slate-700 text-white' : 'hover:bg-slate-100')
        }
      >
        ✏️ <span>Annotate</span>
      </button>
      <div className="ml-auto relative">
        <BackgroundPicker />
      </div>
    </div>
  );
}
