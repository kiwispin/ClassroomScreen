import { Cog } from 'lucide-react';

type Props = {
  open: () => void;
  label?: string;
};

export default function SettingsTriggerButton({ open, label = 'Settings' }: Props) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        open();
      }}
      className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
      aria-label={label}
      title={label}
    >
      <Cog className="w-4 h-4" strokeWidth={1.75} />
    </button>
  );
}
