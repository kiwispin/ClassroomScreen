import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);

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
    </div>
  );
}
