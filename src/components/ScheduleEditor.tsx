import { Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../store/store';
import ScreenDialog, { screenButton, screenInput } from './ScreenDialog';
import { SettingsToggle } from './WidgetSettingsPanel';

const DAYS = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
];

export default function ScheduleEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const presets = useAppStore((s) => s.presets);
  const schedule = useAppStore((s) => s.schedule);
  const enabled = useAppStore((s) => s.scheduleEnabled);
  const addRule = useAppStore((s) => s.addScheduleRule);
  const updateRule = useAppStore((s) => s.updateScheduleRule);
  const deleteRule = useAppStore((s) => s.deleteScheduleRule);
  const toggleEnabled = useAppStore((s) => s.toggleScheduleEnabled);
  if (!open) return null;
  return <ScreenDialog title="Schedule" onClose={onClose}>
    <SettingsToggle label="Auto-load saved screens" checked={enabled} onChange={toggleEnabled} />
    <p className="mt-2 mb-5 text-xs text-slate-500">Keep this page open. Screens load at the selected time using this device’s local time, replacing the current screen.</p>
    {!presets.length ? <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Save a screen first, then choose when it should open.</p>
      : !schedule.length ? <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No scheduled screens yet. Add your first rule below.</p>
      : <ul className="space-y-3">{schedule.map((rule, index) => {
        const missing = !presets.some((p) => p.id === rule.presetId);
        const clash = schedule.some((other) => other.id !== rule.id && other.startTime === rule.startTime && other.daysOfWeek.some((day) => rule.daysOfWeek.includes(day)));
        return <li key={rule.id} className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase text-slate-500">Rule {index + 1}</h3><button className={screenButton + ' !px-2 text-rose-600'} aria-label={`Delete rule ${index + 1}`} onClick={() => deleteRule(rule.id)}><Trash2 className="h-4 w-4" /></button></div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <label className="text-sm font-medium">Time<input className={screenInput + ' mt-1'} aria-label={`Time for rule ${index + 1}`} type="time" value={rule.startTime} onChange={(e) => { if (/^\d{2}:\d{2}$/.test(e.target.value)) updateRule(rule.id, { startTime: e.target.value }); }} /></label>
            <label className="min-w-0 text-sm font-medium">Screen<select className={screenInput + ' mt-1'} aria-label={`Screen for rule ${index + 1}`} value={rule.presetId} onChange={(e) => updateRule(rule.id, { presetId: e.target.value })}>
              {missing && <option value={rule.presetId}>Choose a saved screen</option>}
              {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
          </div>
          <fieldset className="mt-3"><legend className="mb-2 text-sm font-medium">Repeat on</legend><div className="grid grid-cols-7 gap-1">{DAYS.map((day) => {
            const selected = rule.daysOfWeek.includes(day.value);
            return <button key={day.value} type="button" aria-label={`${day.label} for rule ${index + 1}`} aria-pressed={selected}
              className={`min-h-10 rounded-md border text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${selected ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              onClick={() => updateRule(rule.id, { daysOfWeek: selected ? rule.daysOfWeek.filter((d) => d !== day.value) : [...rule.daysOfWeek, day.value] })}>{day.label}</button>;
          })}</div></fieldset>
          {(!rule.daysOfWeek.length || missing || clash) && <p role="status" className="mt-3 text-xs text-amber-700">{missing ? 'Choose a saved screen for this rule.' : !rule.daysOfWeek.length ? 'Choose at least one day for this rule to run.' : 'Another rule uses this time on a selected day. Choose a different time to avoid a conflict.'}</p>}
        </li>;
      })}</ul>}
    <button className={screenButton + ' mt-4 w-full'} disabled={!presets.length} onClick={() => addRule({ presetId: presets[0].id, daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00' })}><Plus className="h-4 w-4" />Add rule</button>
  </ScreenDialog>;
}
