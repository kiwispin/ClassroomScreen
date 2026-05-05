import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
};

type Coords =
  | { right: number; top: number; bottom?: undefined }
  | { right: number; bottom: number; top?: undefined }
  | null;

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
    const right = Math.round(window.innerWidth - rect.right);
    // Flip upward when the trigger is in the lower half of the viewport,
    // so the popover doesn't open off the bottom of the screen.
    const openAbove = rect.top > window.innerHeight / 2;
    if (openAbove) {
      setCoords({ right, bottom: Math.round(window.innerHeight - rect.top + 4) });
    } else {
      setCoords({ right, top: Math.round(rect.bottom + 4) });
    }
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
          className="fixed z-[400] min-w-56 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)] overflow-auto rounded-lg shadow-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
          style={{
            top: coords.top,
            bottom: coords.bottom,
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
