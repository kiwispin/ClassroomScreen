import { forwardRef, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  Icon: LucideIcon;
  label: string;
  title?: string;
  active?: boolean;
  iconColor?: string; // Tailwind text-* class for inactive state
  variant?: 'bar' | 'popover';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

const ACCENTS: Record<string, string> = {
  amber: '#fde68a',
  cyan: '#67e8f9',
  emerald: '#86efac',
  fuchsia: '#f0abfc',
  indigo: '#a5b4fc',
  orange: '#fdba74',
  pink: '#f9a8d4',
  purple: '#c4b5fd',
  red: '#fca5a5',
  rose: '#fda4af',
  sky: '#7dd3fc',
  slate: '#cbd5e1',
  violet: '#c4b5fd',
};

const accentForColor = (cls: string | undefined) => {
  const hue = /(?:^|\s)text-([a-z]+)-/.exec(cls ?? '')?.[1];
  return (hue && ACCENTS[hue]) || '#c4b5fd';
};

function AccentDetail({ label, color }: { label: string; color: string }) {
  const key = label.toLowerCase();

  if (key === 'traffic light') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="13" r="3.4" fill="#fca5a5" />
        <circle cx="20" cy="20" r="3.4" fill="#fde68a" />
        <circle cx="20" cy="27" r="3.4" fill="#86efac" />
      </svg>
    );
  }

  if (key === 'background') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <circle cx="16" cy="17" r="3" fill="#a5b4fc" />
        <circle cx="23" cy="14" r="3" fill="#86efac" />
        <circle cx="25" cy="23" r="3" fill="#f9a8d4" />
      </svg>
    );
  }

  if (key === 'image') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <circle cx="15" cy="15" r="2.8" fill="#86efac" />
        <path d="M11 29 L20 20 L25 25 L29 21 L29 29 Z" fill="#86efac" />
      </svg>
    );
  }

  if (key === 'calendar') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="10" y="12" width="20" height="5" rx="1" fill="#f9a8d4" />
        <rect x="14" y="21" width="12" height="8" rx="1.5" fill="#fef3c7" />
      </svg>
    );
  }

  if (key === 'video') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="11" y="11" width="18" height="18" rx="2" fill="#fca5a5" />
        <rect x="14" y="14" width="12" height="12" rx="1.5" fill="white" />
      </svg>
    );
  }

  if (key === 'poll') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="12" y="12" width="16" height="16" rx="2" fill="#c4b5fd" />
      </svg>
    );
  }

  if (key === 'noise') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <path d="M13 24 L20 18 L20 29 L13 29 Z" fill="#67e8f9" />
        <path d="M25 16 Q30 20 25 25" stroke="#67e8f9" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (key === 'more') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="12" y="12" width="6" height="6" rx="1.5" fill="#a5b4fc" />
        <rect x="22" y="12" width="6" height="6" rx="1.5" fill="#c4b5fd" />
        <rect x="12" y="22" width="6" height="6" rx="1.5" fill="#a5b4fc" />
        <rect x="22" y="22" width="6" height="6" rx="1.5" fill="#c4b5fd" />
      </svg>
    );
  }

  if (key === 'notepad' || key === 'presets') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <path d="M23 9 L31 17 L24 17 Q23 17 23 16 Z" fill="#fde68a" />
      </svg>
    );
  }

  if (key === 'clock') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="8.5" fill="#bae6fd" />
      </svg>
    );
  }

  if (key === 'timer') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="18" y="6" width="5" height="4" rx="1.5" fill="#fdba74" />
        <path d="M20 20 L26 15" stroke="#fdba74" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (key === 'stopwatch') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <path d="M15 12 L25 12 L20 19 Z" fill="#a5b4fc" />
        <path d="M15 28 L25 28 L20 21 Z" fill="#fde68a" />
      </svg>
    );
  }

  if (key === 'name picker') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <path d="M25 10 L31 10 L31 16" stroke="#f0abfc" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 27 L15 27 L15 21" stroke="#f0abfc" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (key === 'dice') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <circle cx="18" cy="18" r="3" fill="#fda4af" />
        <circle cx="25" cy="25" r="3" fill="#fda4af" />
      </svg>
    );
  }

  if (key === 'work symbols') {
    return (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
        <rect x="11" y="12" width="18" height="12" rx="2" fill="#c4b5fd" />
      </svg>
    );
  }

  if (key === 'qr code') return null;

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40" aria-hidden>
      <circle cx="27" cy="13" r="4" fill={color} />
    </svg>
  );
}

const ToolButton = forwardRef<HTMLButtonElement, Props>(function ToolButton(
  { Icon, label, title, active, iconColor, variant = 'bar', onClick },
  ref,
) {
  const compact = variant === 'popover';
  const iconSize = compact ? 'h-9 w-9' : 'h-8 w-8';
  const accent = active ? '#a5b4fc' : accentForColor(iconColor);

  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title ?? label}
      className={
        'shrink-0 flex flex-col items-center justify-center rounded-2xl transition-colors ' +
        (compact
          ? 'h-[98px] min-w-[84px] px-2 py-2 '
          : 'h-[78px] min-w-[82px] px-2 py-2 ') +
        (active
          ? 'bg-indigo-50 text-indigo-600 ring-2 ring-slate-200'
          : 'text-slate-900 hover:bg-slate-50')
      }
    >
      <span className={'relative block ' + iconSize}>
        <AccentDetail label={label} color={accent} />
        <Icon
          className={'relative z-10 text-slate-950 ' + iconSize}
          strokeWidth={2.15}
        />
      </span>
      <span
        className={
          'mt-1.5 max-w-[82px] truncate text-center text-[13px] font-medium leading-tight ' +
          (active ? 'text-indigo-600' : 'text-slate-700')
        }
      >
        {label}
      </span>
    </button>
  );
});

export default ToolButton;
