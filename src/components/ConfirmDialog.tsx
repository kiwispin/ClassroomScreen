type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', destructive, onCancel, onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/30 flex items-center justify-center"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-medium text-slate-800 mb-1">{title}</h2>
        <p className="text-sm text-slate-600 mb-3">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded hover:bg-slate-100 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={
              'px-3 py-1 rounded text-white text-sm ' +
              (destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-800')
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
