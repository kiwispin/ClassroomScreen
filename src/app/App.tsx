import { useEffect, useState } from 'react';
import Toolbar from '../components/Toolbar';
import TopRightCluster from '../components/TopRightCluster';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import AnnotateOverlay from '../overlays/Annotate';
import HelpOverlay from '../components/HelpOverlay';
import GradientDefs from '../components/GradientDefs';
import { useAppStore } from '../store/store';
import { useFullscreen } from '../lib/useFullscreen';
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts';

export default function App() {
  const bg = useAppStore((s) => s.current.background);
  const toggleAnnotate = useAppStore((s) => s.toggleAnnotate);
  const annotateOpen = useAppStore((s) => s.annotateOpen);
  const toggleToolbarHidden = useAppStore((s) => s.toggleToolbarHidden);
  const { toggle: toggleFs } = useFullscreen();
  const [helpOpen, setHelpOpen] = useState(false);

  // Focus / "lesson" mode — hides all chrome for clean projection.
  const [focusMode, setFocusMode] = useState(false);
  const [focusToast, setFocusToast] = useState(false);

  // Show a brief toast when focus mode flips on so the user knows how to exit.
  useEffect(() => {
    if (!focusMode) return;
    setFocusToast(true);
    const id = window.setTimeout(() => setFocusToast(false), 2500);
    return () => window.clearTimeout(id);
  }, [focusMode]);

  useGlobalShortcuts({
    a: () => toggleAnnotate(),
    A: () => toggleAnnotate(),
    b: () => toggleToolbarHidden(),
    B: () => toggleToolbarHidden(),
    f: () => toggleFs(),
    F: () => toggleFs(),
    z: () => setFocusMode((v) => !v),
    Z: () => setFocusMode((v) => !v),
    '?': () => setHelpOpen((v) => !v),
    Escape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (focusMode) setFocusMode(false);
      else if (annotateOpen) toggleAnnotate();
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GradientDefs />
      <BackgroundLayer bg={bg} />
      <WidgetCanvas focusMode={focusMode} />
      {!focusMode && <Toolbar />}
      {!focusMode && <TopRightCluster onOpenHelp={() => setHelpOpen(true)} />}
      <AnnotateOverlay />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Brief toast confirming focus mode + exit hint */}
      {focusMode && focusToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/85 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur shadow pointer-events-none transition-opacity"
          role="status"
        >
          Focus mode — press Z or Esc to exit
        </div>
      )}
    </div>
  );
}
