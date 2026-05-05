import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/store';
import AnnotateToolBar from './ToolBar';

type Tool = 'pen' | 'eraser';

export default function AnnotateOverlay() {
  const open = useAppStore((s) => s.annotateOpen);
  const close = useAppStore((s) => s.toggleAnnotate);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(4);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  if (!open) return null;

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current!;
    ctx.lineWidth = tool === 'eraser' ? Math.max(width * 4, 16) : width;
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  };
  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    const ctx = ctxRef.current!;
    ctx.closePath();
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  return (
    <div className="absolute inset-0 z-[200]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerCancel={endDraw}
      />
      <AnnotateToolBar
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        width={width} setWidth={setWidth}
        onClear={clear}
        onClose={close}
      />
    </div>
  );
}
