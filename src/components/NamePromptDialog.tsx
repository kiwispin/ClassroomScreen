import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
};

export default function NamePromptDialog({
  open, title, initialValue = '', placeholder, onCancel, onSubmit,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, initialValue]);

  if (!open) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/30 flex items-center justify-center"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium text-slate-800 mb-2">{title}</h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full border border-slate-300 rounded px-2 py-1 mb-3 outline-none focus:border-slate-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded hover:bg-slate-100 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
