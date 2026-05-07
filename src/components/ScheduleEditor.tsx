import { createPortal } from 'react-dom';
import { Trash2, Plus, X } from 'lucide-react';
import { useAppStore } from '../store/store';
import type { ScheduleRule } from '../store/types';

// Display order: Mon-first; map back to JS getDay() values (0=Sun..6=Sat).
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ScheduleEditor({ open, onClose }: Props) {
  const presets = useAppStore((s) => s.presets);
  const schedule = useAppStore((s) => s.schedule);
  const enabled = useAppStore((s) => s.scheduleEnabled);
  const addRule = useAppStore((s) => s.addScheduleRule);
  const updateRule = useAppStore((s) => s.updateScheduleRule);
  const deleteRule = useAppStore((s) => s.deleteScheduleRule);
  const toggleEnabled = useAppStore((s) => s.toggleScheduleEnabled);

  if (!open) return null;

  const onAdd = () => {
    if (presets.length === 0) return;
    addRule({
      presetId: presets[0].id,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon–Fri
      startTime: '09:00',
    });
  };

  const toggleDay = (rule: ScheduleRule, day: number) => {
    const has = rule.daysOfWeek.includes(day);
    const days = has
      ? rule.daysOfWeek.filter((d) => d !== day)
      : [...rule.daysOfWeek, day];
    updateRule(rule.id, { daysOfWeek: days });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[560px] max-w-full max-h-[calc(100vh-32px)] flex flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Schedule</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Enable toggle */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-800 text-sm">
              Auto-load presets by time of day
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Triggers at the start of the matching minute on selected days.
            </div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={toggleEnabled}
            />
            <div className="relative w-11 h-6 bg-slate-200 peer-checked:bg-indigo-500 rounded-full transition-colors">
              <div
                className={
                  'absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ' +
                  (enabled ? 'translate-x-5' : '')
                }
              />
            </div>
          </label>
        </div>

        {/* Rules */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          {presets.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">
              You need at least one saved preset before you can schedule it.
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6">
              No scheduled rules yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {schedule.map((rule) => (
                <li
                  key={rule.id}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) =>
                      updateRule(rule.id, { startTime: e.target.value })
                    }
                    className="border border-slate-300 rounded px-2 py-1 text-sm font-mono"
                  />

                  <div className="flex items-center gap-0.5">
                    {DAY_LABELS.map((label, i) => {
                      const dayValue = DAY_VALUES[i];
                      const on = rule.daysOfWeek.includes(dayValue);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDay(rule, dayValue)}
                          className={
                            'h-7 w-7 rounded-md text-xs font-semibold transition-colors ' +
                            (on
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100')
                          }
                          title={
                            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayValue]
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <select
                    value={rule.presetId}
                    onChange={(e) =>
                      updateRule(rule.id, { presetId: e.target.value })
                    }
                    className="border border-slate-300 rounded px-2 py-1 text-sm flex-1 min-w-[120px]"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="h-7 w-7 rounded hover:bg-rose-50 flex items-center justify-center text-rose-600"
                    title="Delete rule"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: add */}
        <div className="border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onAdd}
            disabled={presets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500 text-white text-sm hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add rule</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
