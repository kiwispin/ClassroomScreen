import { forwardRef, type MouseEvent } from 'react';

type Props = {
  icon: string;
  label: string;
  title?: string;
  active?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

const ToolButton = forwardRef<HTMLButtonElement, Props>(function ToolButton(
  { icon, label, title, active, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title ?? label}
      className={
        'shrink-0 flex flex-col items-center justify-center px-2 py-1 rounded-xl min-w-[64px] transition-colors ' +
        (active
          ? 'bg-indigo-500 text-white'
          : 'hover:bg-slate-100 text-slate-700')
      }
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span
        className={
          'text-[10px] mt-0.5 max-w-[68px] truncate ' +
          (active ? 'text-white' : 'text-slate-500')
        }
      >
        {label}
      </span>
    </button>
  );
});

export default ToolButton;
