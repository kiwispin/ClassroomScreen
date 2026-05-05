import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/store';
import AnnotateToolBar from './ToolBar';

type Tool = 'pen' | 'eraser';
type Point = { x: number; y: number };
type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
};

const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
  if (s.points.length === 0) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s.tool === 'eraser' ? Math.max(s.width * 4, 16) : s.width;
  ctx.strokeStyle = s.color;
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    ctx.lineTo(s.points[i].x, s.points[i].y);
  }
  // For single-point strokes, draw a dot
  if (s.points.length === 1) {
    ctx.lineTo(s.points[0].x + 0.01, s.points[0].y + 0.01);
  }
  ctx.stroke();
};

export default function AnnotateOverlay() {
  const open = useAppStore((s) => s.annotateOpen);
  const close = useAppStore((s) => s.toggleAnnotate);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0); // forces re-render so the Undo button enables/disables

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(4);

  const redrawAll = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);
  };

  // Mount canvas, fit to viewport, redraw on resize
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      redrawAll();
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes the overlay
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    currentStrokeRef.current = {
      tool,
      color,
      width,
      points: [{ x: e.clientX, y: e.clientY }],
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Draw the first dot immediately
    redrawAll();
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push({ x: e.clientX, y: e.clientY });
    // Incremental: just stroke the new segment for performance
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawStroke(ctx, currentStrokeRef.current);
  };
  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStrokeRef.current) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
      setStrokeCount(strokesRef.current.length);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const undo = () => {
    if (strokesRef.current.length === 0 && !currentStrokeRef.current) return;
    if (drawingRef.current && currentStrokeRef.current) {
      // Cancel an in-progress stroke
      currentStrokeRef.current = null;
      drawingRef.current = false;
    } else {
      strokesRef.current.pop();
    }
    setStrokeCount(strokesRef.current.length);
    redrawAll();
  };

  const clear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    drawingRef.current = false;
    setStrokeCount(0);
    redrawAll();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 cursor-crosshair touch-none z-[100]"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      />
      <AnnotateToolBar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        canUndo={strokeCount > 0}
        onUndo={undo}
        onClear={clear}
        onClose={close}
      />
    </>
  );
}
