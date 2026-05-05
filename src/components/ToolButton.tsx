import { forwardRef, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  Icon: LucideIcon;
  label: string;
  title?: string;
  active?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

const ToolButton = forwardRef<HTMLButtonElement, Props>(function ToolButton(
  { Icon, label, title, active, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title ?? label}
      className={
        'shrink-0 flex flex-col items-center justify-center px-2 py-1.5 rounded-xl min-w-[64px] transition-colors ' +
        (active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-700 hover:bg-slate-100')
      }
    >
      <Icon
        className={'w-6 h-6 ' + (active ? 'stroke-indigo-600' : 'stroke-slate-700')}
        strokeWidth={1.75}
      />
      <span
        className={
          'text-[10px] mt-0.5 max-w-[68px] truncate font-medium ' +
          (active ? 'text-indigo-700' : 'text-slate-500')
        }
      >
        {label}
      </span>
    </button>
  );
});

export default ToolButton;
