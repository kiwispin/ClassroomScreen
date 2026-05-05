import { useState } from 'react';
import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import AnnotateOverlay from '../overlays/Annotate';
import HelpOverlay from '../components/HelpOverlay';
import { useAppStore } from '../store/store';
import { useFullscreen } from '../lib/useFullscreen';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';

export default function App() {
  const bg = useAppStore((s) => s.current.background);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const { toggle: toggleFs } = useFullscreen();
  const [helpOpen, setHelpOpen] = useState(false);

  useGlobalShortcuts({
    a: () => toggleAnnotate(),
    A: () => toggleAnnotate(),
    f: () => toggleFs(),
    F: () => toggleFs(),
    '?': () => setHelpOpen((v) => !v),
    Escape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (annotateOpen) toggleAnnotate();
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer bg={bg} />
      <WidgetCanvas />
      <Toolbar onOpenHelp={() => setHelpOpen(true)} />
      <AnnotateOverlay />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
