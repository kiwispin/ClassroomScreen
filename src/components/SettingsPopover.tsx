import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  trigger: (open: () => void, openState: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  title?: string;
  panelClassName?: string;
  arrow?: boolean;
};

type Coords =
  | { right: number; arrowRight: number; top: number; bottom?: undefined; placement: 'below' }
  | { right: number; arrowRight: number; bottom: number; top?: undefined; placement: 'above' }
  | null;

export default function SettingsPopover({
  trigger,
  children,
  title,
  panelClassName,
  arrow = false,
}: Props) {
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
    const arrowRight = Math.max(18, Math.round(rect.width / 2 - 8));
    // Flip upward when the trigger is in the lower half of the viewport,
    // so the popover doesn't open off the bottom of the screen.
    const openAbove = rect.top > window.innerHeight / 2;
    if (openAbove) {
      setCoords({
        right,
        arrowRight,
        bottom: Math.round(window.innerHeight - rect.top + 10),
        placement: 'above',
      });
    } else {
      setCoords({
        right,
        arrowRight,
        top: Math.round(rect.bottom + 10),
        placement: 'below',
      });
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
        {trigger(handleOpen, open)}
      </span>
      {open && coords && createPortal(
        <div
          ref={popRef}
          className={
            'fixed z-[400] min-w-56 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)] rounded-2xl border border-slate-200/90 bg-white text-sm text-slate-700 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.42),0_2px_12px_-6px_rgba(15,23,42,0.22)] ' +
            (panelClassName ?? 'overflow-auto p-3')
          }
          style={{
            top: coords.top,
            bottom: coords.bottom,
            right: Math.max(8, coords.right),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {arrow && (
            <div
              className={
                'absolute h-4 w-4 rotate-45 border-slate-200/90 bg-white ' +
                (coords.placement === 'above'
                  ? '-bottom-2 border-b border-r'
                  : '-top-2 border-l border-t')
              }
              style={{ right: coords.arrowRight }}
              aria-hidden
            />
          )}
          {title && (
            <div className="relative z-10 border-b border-slate-200/90 px-6 py-4 text-center text-lg font-medium text-indigo-500">
              {title}
            </div>
          )}
          <div className="relative z-10">
            {children(() => setOpen(false))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
