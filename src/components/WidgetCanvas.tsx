import { Rnd } from 'react-rnd';
import { useAppStore } from '../store/store';
import WidgetTile from './WidgetTile';
import WidgetChrome from './WidgetChrome';

export default function WidgetCanvas() {
  const widgets = useAppStore((s) => s.current.widgets);
  const updatePos = useAppStore((s) => s.updateWidgetPosition);
  const updateSize = useAppStore((s) => s.updateWidgetSize);
  const focusWidget = useAppStore((s) => s.focusWidget);

  return (
    <div className="absolute inset-0">
      {widgets.map((w) => (
        <Rnd
          key={w.id}
          className="group"
          position={{ x: w.position.x, y: w.position.y }}
          size={{ width: w.size.width, height: w.size.height }}
          bounds="parent"
          minWidth={120}
          minHeight={80}
          cancel="input,textarea,select,button,a,canvas"
          style={{ zIndex: w.zIndex }}
          onDragStart={() => focusWidget(w.id)}
          onDragStop={(_e, d) => updatePos(w.id, d.x, d.y)}
          onResizeStop={(_e, _dir, ref, _delta, pos) => {
            updateSize(w.id, ref.offsetWidth, ref.offsetHeight);
            updatePos(w.id, pos.x, pos.y);
          }}
        >
          <WidgetChrome instance={w} />
          <WidgetTile instance={w} />
        </Rnd>
      ))}
    </div>
  );
}
