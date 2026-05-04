import Toolbar from '../components/Toolbar';
import WidgetCanvas from '../components/WidgetCanvas';
import { useAppStore } from '../store/store';

export default function App() {
  const bg = useAppStore((s) => s.current.background);

  const backgroundStyle =
    bg.kind === 'solid'
      ? { backgroundColor: bg.color }
      : bg.kind === 'gradient'
        ? { backgroundImage: bg.css }
        : {};

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={backgroundStyle}
    >
      <WidgetCanvas />
      <Toolbar />
    </div>
  );
}
