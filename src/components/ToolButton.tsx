import { forwardRef, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { gradientForColor } from './GradientDefs';

type Props = {
  Icon: LucideIcon;
  label: string;
  title?: string;
  active?: boolean;
  iconColor?: string; // Tailwind text-* class for inactive state
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

const ToolButton = forwardRef<HTMLButtonElement, Props>(function ToolButton(
  { Icon, label, title, active, iconColor, onClick },
  ref,
) {
  const grad = !active ? gradientForColor(iconColor) : undefined;

  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title ?? label}
      className={
        'shrink-0 flex flex-col items-center justify-center px-2 py-1.5 rounded-xl min-w-[64px] transition-colors ' +
        (active
          ? 'bg-indigo-50/80 text-indigo-700'
          : 'text-slate-700 hover:bg-white/40')
      }
    >
      <Icon
        className={
          'w-6 h-6 transition-[filter] ' +
          (active ? 'text-indigo-600' : iconColor ?? 'text-slate-700')
        }
        strokeWidth={1.75}
        style={{
          stroke: grad ? `url(#${grad})` : undefined,
          filter: grad
            ? 'drop-shadow(0 1px 0 rgba(15,23,42,0.08))'
            : undefined,
        }}
      />
      <span
        className={
          'text-[10px] mt-0.5 max-w-[68px] truncate font-medium ' +
          (active ? 'text-indigo-700' : 'text-slate-600')
        }
      >
        {label}
      </span>
    </button>
  );
});

export default ToolButton;
