import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import BackgroundLayer from '../overlays/Background';
import AnnotateOverlay from '../overlays/Annotate';
import { useAppStore } from '../store/store';

export default function App() {
  const bg = useAppStore((s) => s.current.background);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BackgroundLayer bg={bg} />
      <WidgetCanvas />
      <Toolbar />
      <AnnotateOverlay />
    </div>
  );
}
