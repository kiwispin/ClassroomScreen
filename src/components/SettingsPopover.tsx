import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
};

type Coords = { top: number; right: number } | null;

export default function SettingsPopover({ trigger, children }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const computeCoords = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const target = (wrapper.firstElementChild as HTMLElement | null) ?? wrapper;
    const rect = target.getBoundingClientRect();
    setCoords({
      top: Math.round(rect.bottom + 4),
      right: Math.round(window.innerWidth - rect.right),
    });
  };

  const handleOpen = () => {
    computeCoords();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onResize = () => computeCoords();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  return (
    <>
      <span ref={wrapperRef} style={{ display: 'contents' }}>
        {trigger(handleOpen)}
      </span>
      {open && coords && createPortal(
        <div
          ref={popRef}
          className="fixed z-[400] min-w-56 max-w-[calc(100vw-16px)] rounded-lg shadow-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
          style={{
            top: coords.top,
            right: Math.max(8, coords.right),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>,
        document.body,
      )}
    </>
  );
}
