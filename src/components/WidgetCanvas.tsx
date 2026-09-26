import type { CSSProperties } from 'react';
import { Rnd } from 'react-rnd';
import { useAppStore } from '../store/store';
import WidgetTile from './WidgetTile';
import WidgetChrome from './WidgetChrome';

const HANDLE_BASE: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: '9999px',
  background: 'white',
  border: '2px solid #6366f1', // indigo-500
  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
};

const HANDLE_STYLES = {
  topLeft:     { ...HANDLE_BASE, top: -7, left: -7 },
  topRight:    { ...HANDLE_BASE, top: -7, right: -7 },
  bottomLeft:  { ...HANDLE_BASE, bottom: -7, left: -7 },
  bottomRight: { ...HANDLE_BASE, bottom: -7, right: -7 },
};

const HANDLE_FADE = 'opacity-0 group-hover:opacity-100 transition-opacity duration-150';
const HANDLE_CLASSES = {
  topLeft: HANDLE_FADE,
  topRight: HANDLE_FADE,
  bottomLeft: HANDLE_FADE,
  bottomRight: HANDLE_FADE,
};

const ENABLE_CORNERS_ONLY = {
  top: false, right: false, bottom: false, left: false,
  topLeft: true, topRight: true, bottomLeft: true, bottomRight: true,
};

const ENABLE_NONE = {
  top: false, right: false, bottom: false, left: false,
  topLeft: false, topRight: false, bottomLeft: false, bottomRight: false,
};

type Props = { focusMode?: boolean };

export default function WidgetCanvas({ focusMode = false }: Props) {
  const widgets = useAppStore((s) => s.current.widgets);
  const commitLayout = useAppStore((s) => s.commitWidgetLayout);
  const snap = useAppStore((s) => s.snapToGrid);
  const selected = useAppStore((s) => s.selectedWidgetIds);
  const select = useAppStore((s) => s.selectWidget);
  const clearSelection = useAppStore((s) => s.clearWidgetSelection);
  const focusWidget = useAppStore((s) => s.focusWidget);

  return (
    <div className="absolute inset-0" onMouseDown={(event) => { if (event.target === event.currentTarget) clearSelection(); }}>
      {widgets.map((w) => (
        <Rnd
          key={w.id}
          // Drop the `group` class in focus mode so chrome / handles / hover
          // ring don't react to mouseover.
          className={focusMode ? '' : `group ${selected.includes(w.id) ? 'outline outline-2 outline-indigo-500 rounded-xl' : ''}`}
          position={{ x: w.position.x, y: w.position.y }}
          size={{ width: w.size.width, height: w.size.height }}
          bounds="parent"
          minWidth={w.type === 'timetable' ? 280 : 120}
          minHeight={80}
          cancel="input,textarea,select,button,a,canvas"
          style={{ zIndex: w.zIndex }}
          disableDragging={focusMode || w.locked}
          dragGrid={snap ? [16, 16] : [1, 1]}
          resizeGrid={snap ? [16, 16] : [1, 1]}
          enableResizing={focusMode || w.locked ? ENABLE_NONE : ENABLE_CORNERS_ONLY}
          resizeHandleStyles={HANDLE_STYLES}
          resizeHandleClasses={HANDLE_CLASSES}
          onDragStart={() => focusWidget(w.id)}
          onDragStop={(_e, d) => commitLayout(w.id, { x: d.x, y: d.y })}
          onResizeStop={(_e, _dir, ref, _delta, pos) => {
            commitLayout(w.id, pos, { width: ref.offsetWidth, height: ref.offsetHeight });
          }}
        >
          <div className="h-full w-full" onMouseDownCapture={(event) => {
            if (focusMode || w.locked || (event.target as HTMLElement).closest('button,input,textarea,select,a')) return;
            select(w.id, event.shiftKey);
          }}>
            {!focusMode && <WidgetChrome instance={w} />}
            <WidgetTile instance={w} />
          </div>
        </Rnd>
      ))}
    </div>
  );
}
