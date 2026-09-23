import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';

type Props = {
  trigger: (toggle: () => void, open: boolean, panelId: string) => ReactNode;
  title: string;
  TitleIcon?: LucideIcon;
  widthClassName?: string;
  children: (close: () => void) => ReactNode;
};

export default function WidgetSettingsPanel({
  trigger,
  title,
  TitleIcon,
  widthClassName,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);

  const close = (restoreFocus = true) => {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    restoreFocusRef.current = false;
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      if (restoreFocusRef.current) {
        triggerRef.current?.querySelector<HTMLElement>('button')?.focus();
        restoreFocusRef.current = false;
      }
      return;
    }

    closeRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        close(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <>
      <span ref={triggerRef} style={{ display: 'contents' }}>
        {trigger(toggle, open, panelId)}
      </span>
      {open && createPortal(
        <section
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          data-shortcuts-scope="local"
          className={`fixed right-3 top-3 z-[400] flex max-h-[calc(100dvh-24px)] ${widthClassName ?? 'w-[min(25rem,calc(100vw-24px))]'} flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.42),0_2px_12px_-6px_rgba(15,23,42,0.22)]`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
            <h2 id={`${panelId}-title`} className="flex min-w-0 items-center gap-2 text-base font-semibold text-slate-800">
              {TitleIcon && <TitleIcon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
              {title}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => close()}
              aria-label="Close settings"
              title="Close settings"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-1">
            {children(() => close())}
          </div>
        </section>,
        document.body,
      )}
    </>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="border-b border-slate-200 py-4 last:border-b-0" aria-labelledby={id}>
      <h3 id={id} className="mb-3 text-xs font-semibold uppercase text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SettingsToggle({
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}>
      <span className="min-w-0">
        <span className="block font-medium text-slate-700">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-indigo-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 peer-disabled:bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
        />
      </span>
    </label>
  );
}
