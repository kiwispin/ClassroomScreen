import { Maximize2, Minimize2, HelpCircle, Pin, PinOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../store/store';
import { useFullscreen } from '../lib/useFullscreen';

type Props = {
  onOpenHelp: () => void;
};

type ButtonSpec = {
  Icon: LucideIcon;
  title: string;
  onClick: () => void;
  active?: boolean;
};

export default function TopRightCluster({ onOpenHelp }: Props) {
  const pinned = useAppStore((s) => s.toolbarPinned);
  const togglePinned = useAppStore((s) => s.toggleToolbarPinned);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const buttons: ButtonSpec[] = [
    {
      Icon: isFs ? Minimize2 : Maximize2,
      title: isFs ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)',
      onClick: toggleFs,
      active: isFs,
    },
    {
      Icon: HelpCircle,
      title: 'Keyboard shortcuts (?)',
      onClick: onOpenHelp,
    },
    {
      Icon: pinned ? Pin : PinOff,
      title: pinned ? 'Toolbar pinned (click to auto-hide)' : 'Toolbar auto-hides (click to pin)',
      onClick: togglePinned,
      active: pinned,
    },
  ];

  return (
    <div
      className="fixed top-3 right-3 z-[300] flex items-center gap-1 rounded-full px-1 py-1 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/80 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.22),0_2px_6px_-2px_rgba(15,23,42,0.12)]"
    >
      {buttons.map(({ Icon, title, onClick, active }, i) => (
        <button
          key={i}
          onClick={onClick}
          title={title}
          aria-label={title}
          className={
            'h-8 w-8 rounded-full flex items-center justify-center transition-colors ' +
            (active
              ? 'bg-indigo-50/80 text-indigo-700'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900')
          }
        >
          <Icon
            className="w-5 h-5"
            strokeWidth={1.75}
            style={{
              stroke: active ? undefined : 'url(#grad-slate)',
              filter: active
                ? undefined
                : 'drop-shadow(0 1px 0 rgba(15,23,42,0.08))',
            }}
          />
        </button>
      ))}
    </div>
  );
}
