import { Maximize2, Minimize2, HelpCircle, Pin, PinOff } from 'lucide-react';
import { useAppStore } from '../store/store';
import { useFullscreen } from '../lib/useFullscreen';

type Props = {
  onOpenHelp: () => void;
};

export default function TopRightCluster({ onOpenHelp }: Props) {
  const pinned = useAppStore((s) => s.toolbarPinned);
  const togglePinned = useAppStore((s) => s.toggleToolbarPinned);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const buttons: Array<{
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    active?: boolean;
  }> = [
    {
      icon: isFs ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />,
      title: isFs ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)',
      onClick: toggleFs,
      active: isFs,
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: 'Keyboard shortcuts (?)',
      onClick: onOpenHelp,
    },
    {
      icon: pinned
        ? <Pin className="w-5 h-5" />
        : <PinOff className="w-5 h-5" />,
      title: pinned ? 'Toolbar pinned (click to auto-hide)' : 'Toolbar auto-hides (click to pin)',
      onClick: togglePinned,
      active: pinned,
    },
  ];

  return (
    <div className="fixed top-3 right-3 z-[300] flex items-center gap-1 rounded-full bg-white/95 backdrop-blur shadow-md border border-slate-200/80 px-1 py-1">
      {buttons.map((b, i) => (
        <button
          key={i}
          onClick={b.onClick}
          title={b.title}
          aria-label={b.title}
          className={
            'h-8 w-8 rounded-full flex items-center justify-center transition-colors ' +
            (b.active
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
          }
        >
          {b.icon}
        </button>
      ))}
    </div>
  );
}
