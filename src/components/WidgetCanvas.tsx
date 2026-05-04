import { Rnd } from 'react-rnd';
import { useAppStore } from '../store/store';
import WidgetTile from './WidgetTile';

export default function WidgetCanvas() {
  const widgets = useAppStore((s) => s.current.widgets);
  const updatePos = useAppStore((s) => s.updateWidgetPosition);
  const updateSize = useAppStore((s) => s.updateWidgetSize);
  const focusWidget = useAppStore((s) => s.focusWidget);

  return (
    <div className="absolute inset-0 pt-12">
      {widgets.map((w) => (
        <Rnd
          key={w.id}
          position={{ x: w.position.x, y: w.position.y }}
          size={{ width: w.size.width, height: w.size.height }}
          dragHandleClassName="drag-handle"
          bounds="parent"
          minWidth={120}
          minHeight={80}
          style={{ zIndex: w.zIndex }}
          onDragStart={() => focusWidget(w.id)}
          onDragStop={(_e, d) => updatePos(w.id, d.x, d.y)}
          onResizeStop={(_e, _dir, ref, _delta, pos) => {
            updateSize(w.id, ref.offsetWidth, ref.offsetHeight);
            updatePos(w.id, pos.x, pos.y);
          }}
        >
          <WidgetTile instance={w} />
        </Rnd>
      ))}
    </div>
  );
}
