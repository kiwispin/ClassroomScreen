import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { allWidgets } from '../widgets/registry';
import { useAppStore } from '../store/store';
import BackgroundPicker from '../overlays/Background/Picker';
import PresetMenu from './PresetMenu';
import ToolButton from './ToolButton';

const IDLE_MS = 4_000;

export default function Toolbar() {
  const addWidget = useAppStore((s) => s.addWidget);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const pinned = useAppStore((s) => s.toolbarPinned);

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
        'fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3 pointer-events-none transition-transform duration-200 ' +
        (visible ? 'translate-y-0' : 'translate-y-[120%]')
      }
    >
      <div className="pointer-events-auto rounded-2xl shadow-md border border-slate-200/80 bg-white/95 backdrop-blur px-2 py-1.5 flex items-center gap-0.5 max-w-[calc(100vw-24px)] overflow-x-auto">
        <ToolButton
          Icon={Pencil}
          label="annotate"
          title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
          active={annotateOpen}
          onClick={toggleAnnotate}
        />
        <div className="shrink-0 w-px h-8 bg-slate-200/80 mx-1" />
        {allWidgets.map((w) => (
          <ToolButton
            key={w.type}
            Icon={w.Icon}
            label={w.label.toLowerCase()}
            title={`Add ${w.label}`}
            onClick={() => addWidget(w.type)}
          />
        ))}
        <div className="shrink-0 w-px h-8 bg-slate-200/80 mx-1" />
        <PresetMenu />
        <BackgroundPicker />
      </div>
    </div>
  );
}
