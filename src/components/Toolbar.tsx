import { useEffect, useMemo, useState } from 'react';
import { Pencil, LayoutGrid } from 'lucide-react';
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
        'fixed bottom-0 left-0 right-0 z-[300] flex justify-center pb-3 pointer-events-none transition-transform duration-200 ' +
        (visible ? 'translate-y-0' : 'translate-y-[120%]')
      }
    >
      <div
        className="pointer-events-auto rounded-2xl px-3 py-2 flex items-center gap-0.5 max-w-[calc(100vw-24px)] overflow-x-auto bg-white/75 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/80 shadow-[0_10px_40px_-8px_rgba(15,23,42,0.22),0_2px_6px_-2px_rgba(15,23,42,0.14)]"
      >
        <ToolButton
          Icon={Pencil}
          label="annotate"
          title={annotateOpen ? 'Exit annotate (A)' : 'Toggle Annotate (A)'}
          active={annotateOpen}
          onClick={toggleAnnotate}
        />
        <div className="shrink-0 w-px h-10 bg-slate-200/80 mx-1" />
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
            trigger={(open) => (
              <ToolButton
                Icon={LayoutGrid}
                label="more"
                title={`More widgets (${secondary.length})`}
                onClick={open}
              />
            )}
          >
            {(close) => (
              <div className="grid grid-cols-3 gap-0.5 w-[12rem]">
                {secondary.map((w) => (
                  <ToolButton
                    key={w.type}
                    Icon={w.Icon}
                    label={w.label.toLowerCase()}
                    title={`Add ${w.label}`}
                    iconColor={w.iconColor}
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
        <div className="shrink-0 w-px h-10 bg-slate-200/80 mx-1" />
        <PresetMenu />
        <BackgroundPicker />
      </div>
    </div>
  );
}
