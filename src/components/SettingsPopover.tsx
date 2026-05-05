import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  trigger: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
};

export default function SettingsPopover({ trigger, children }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          ref={popRef}
          className="absolute right-0 top-full mt-1 z-[100] min-w-56 rounded-lg shadow-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}
