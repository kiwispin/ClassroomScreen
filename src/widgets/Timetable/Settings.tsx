import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  List,
  ListChecks,
  Plus,
  Minus,
  Trash2,
  Volume2,
  Clock3,
  Settings2,
} from 'lucide-react';
import WidgetSettingsPanel, {
  SettingsSection,
  SettingsToggle,
} from '../../components/WidgetSettingsPanel';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import { SFX_NAMES, playSfx } from '../../lib/audio';
import { newId } from '../../lib/uuid';
import type { WidgetSettingsProps } from '../Demo/meta';
import {
  addBreakAfterActivity,
  adjustDuration,
  DEFAULT_ACTIVITY_MINUTES,
  DEFAULT_BREAK_MINUTES,
  MAX_SCHEDULE_MINUTES,
  MIN_DURATION_MINUTES,
  moveActivity,
  moveItem,
  readTimetableItems,
  removeActivity,
  reorderActivity,
  reorderItem,
  totalDurationMinutes,
  type TimetableConfig,
  type TimetableItem,
  type TimetableMode,
  type TimetableTimeFormat,
} from './logic';
import { PictogramPicker } from './Pictograms';

const MODES: Array<{ value: TimetableMode; label: string; Icon: typeof List }> = [
  { value: 'list', label: 'List', Icon: List },
  { value: 'checklist', label: 'Checklist', Icon: ListChecks },
  { value: 'timed', label: 'Timed schedule', Icon: Clock3 },
];

const iconButtonClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500';

function DurationControl({
  item,
  items,
  max,
  onAdjust,
  onSet,
}: {
  item: TimetableItem;
  items: TimetableItem[];
  max: number;
  onAdjust: (direction: -1 | 1) => void;
  onSet: (minutes: number) => number;
}) {
  const [draft, setDraft] = useState(String(item.durationMinutes));
  const total = totalDurationMinutes(items);
  const canIncrease = total + 5 <= MAX_SCHEDULE_MINUTES;
  useEffect(() => setDraft(String(item.durationMinutes)), [item.durationMinutes]);
  const commit = () => {
    const value = Number(draft);
    if (Number.isInteger(value) && value >= MIN_DURATION_MINUTES) setDraft(String(onSet(value)));
    else setDraft(String(item.durationMinutes));
  };

  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs text-slate-600" htmlFor={`duration-${item.id}`}>
        Duration (minutes)
      </label>
      <div className="flex h-8 w-fit max-w-full items-center gap-0.5 rounded-md border border-slate-200 bg-white px-0.5">
        <button
          type="button"
          className={iconButtonClass}
          aria-label={`Decrease ${item.kind} duration`}
          title="Decrease by 5 minutes"
          disabled={item.durationMinutes <= MIN_DURATION_MINUTES}
          onClick={() => onAdjust(-1)}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <input
          id={`duration-${item.id}`}
          type="number"
          inputMode="numeric"
          min={MIN_DURATION_MINUTES}
          max={max}
          step={1}
          aria-label={`${item.kind === 'break' ? 'Break' : item.title || 'Activity'} duration in minutes`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className="h-7 w-14 min-w-0 border-0 bg-transparent p-0 text-center text-xs font-medium tabular-nums text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <span className="pr-1 text-[11px] text-slate-500">min</span>
        <button
          type="button"
          className={iconButtonClass}
          aria-label={`Increase ${item.kind} duration`}
          title="Increase by 5 minutes"
          disabled={!canIncrease}
          onClick={() => onAdjust(1)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function TimetableSettings({
  instance,
  inlineTrigger = false,
}: WidgetSettingsProps & { inlineTrigger?: boolean }) {
  const updateConfig = useAppStore((state) => state.updateWidgetConfig);
  const cfg = instance.config as TimetableConfig;
  const mode: TimetableMode = cfg.mode === 'list' || cfg.mode === 'checklist'
    ? cfg.mode : 'timed';
  const startTime = cfg.startTime ?? '08:00';
  const timeFormat: TimetableTimeFormat = cfg.timeFormat === '24' ? '24' : '12';
  const showTitle = cfg.showTitle ?? true;
  const title = cfg.title ?? "What's going on today";
  const alarm = cfg.alarm ?? 'bell';
  const items = readTimetableItems(cfg.activities);
  const activityItems = items.filter((item) => item.kind === 'activity');
  const visibleItems = mode === 'timed' ? items : activityItems;
  const dragId = useRef<string | null>(null);
  const remainingMinutes = MAX_SCHEDULE_MINUTES - totalDurationMinutes(items);

  const getMaximumFor = (item: TimetableItem) => Math.max(
    1,
    Math.min(MAX_SCHEDULE_MINUTES, MAX_SCHEDULE_MINUTES - totalDurationMinutes(items) + item.durationMinutes),
  );
  const setDuration = (itemId: string, value: number): number => {
    const current = items.find((item) => item.id === itemId);
    if (!current) return value;
    const maximum = mode === 'timed' ? getMaximumFor(current) : MAX_SCHEDULE_MINUTES;
    const durationMinutes = Math.min(Math.max(MIN_DURATION_MINUTES, Math.floor(value)), maximum);
    updateItems(items.map((item) => item.id === itemId ? { ...item, durationMinutes } : item));
    return durationMinutes;
  };

  const updateItems = (next: TimetableItem[]) => updateConfig(instance.id, { activities: next });
  const patchActivity = (id: string, patch: Partial<TimetableItem>) => {
    updateItems(items.map((item) => item.id === id && item.kind === 'activity'
      ? { ...item, ...patch }
      : item));
  };
  const pickActivityPictogram = (
    id: string,
    value: { icon?: string; imageId?: string },
  ) => {
    updateItems(items.map((item) => item.id === id && item.kind === 'activity'
      ? { ...item, icon: undefined, imageId: undefined, ...value }
      : item));
  };
  const setMode = (value: TimetableMode) => updateConfig(instance.id, { mode: value });
  const addActivity = () => {
    if (mode === 'timed' && remainingMinutes < 1) return;
    const durationMinutes = mode === 'timed'
      ? Math.min(DEFAULT_ACTIVITY_MINUTES, Math.floor(remainingMinutes))
      : DEFAULT_ACTIVITY_MINUTES;
    updateItems([...items, {
      id: newId(),
      kind: 'activity',
      title: '',
      durationMinutes,
    }]);
  };
  const onDropItem = (targetId: string, event: React.DragEvent) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;
    updateItems(mode === 'timed'
      ? reorderItem(items, sourceId, targetId)
      : reorderActivity(items, sourceId, targetId));
  };

  return (
    <WidgetSettingsPanel
      title="Timetable settings"
      trigger={(toggle, open, panelId) => inlineTrigger ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Edit activities
        </button>
      ) : (
        <SettingsTriggerButton
          open={toggle}
          label="Timetable settings"
          expanded={open}
          controls={panelId}
        />
      )}
    >
      {() => <>
        <SettingsSection title="Display">
          <div className="flex flex-col gap-3">
            <SettingsToggle
              label="Show title"
              checked={showTitle}
              onChange={(checked) => updateConfig(instance.id, { showTitle: checked })}
            />
            {showTitle && (
              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Title</span>
                <input
                  type="text"
                  aria-label="Timetable title"
                  value={title}
                  onChange={(event) => updateConfig(instance.id, { title: event.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            )}
            <div>
              <span className="mb-1.5 block font-medium text-slate-700">Display mode</span>
              <div role="group" aria-label="Display mode" className="grid grid-cols-3 rounded-md border border-slate-300 bg-slate-50 p-0.5">
                {MODES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`flex min-h-9 min-w-0 items-center justify-center gap-1 rounded px-1.5 text-xs font-medium transition-colors ${mode === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsSection>

        {mode === 'timed' && (
          <SettingsSection title="Timed schedule">
            <label className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-700">Start time</span>
              <input
                type="time"
                aria-label="Schedule start time"
                value={startTime}
                onChange={(event) => updateConfig(instance.id, { startTime: event.target.value })}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <div>
              <span className="mb-1.5 block font-medium text-slate-700">Time format</span>
              <div role="group" aria-label="Time format" className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
                {(['12', '24'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    aria-pressed={timeFormat === format}
                    onClick={() => updateConfig(instance.id, { timeFormat: format })}
                    className={`min-w-14 rounded px-3 py-1.5 text-xs font-medium ${timeFormat === format ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}
                  >
                    {format} hour
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block font-medium text-slate-700">Activity-end alarm</span>
              <div className="flex items-center gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Activity-end alarm sound</span>
                  <select
                    aria-label="Activity-end alarm sound"
                    value={alarm}
                    onChange={(event) => updateConfig(instance.id, { alarm: event.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="none">Silence</option>
                    {SFX_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Preview activity-end alarm"
                  title="Preview selected alarm"
                  disabled={alarm === 'none'}
                  onClick={() => {
                    if (SFX_NAMES.includes(alarm as (typeof SFX_NAMES)[number])) {
                      playSfx(alarm as (typeof SFX_NAMES)[number]);
                    }
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </SettingsSection>
        )}

        <SettingsSection title="Activities">
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const rowIndex = visibleItems.findIndex((candidate) => candidate.id === item.id);
              if (item.kind === 'break') {
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-2"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropItem(item.id, event)}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-600">Break</span>
                      <button
                        type="button"
                        draggable
                        aria-label="Drag to reorder break"
                        title="Drag to reorder"
                        className={`${iconButtonClass} cursor-grab active:cursor-grabbing`}
                        onDragStart={(event) => {
                          dragId.current = item.id;
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', item.id);
                        }}
                        onDragEnd={() => { dragId.current = null; }}
                      >
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Move break up"
                        title="Move up"
                        disabled={rowIndex === 0}
                        onClick={() => updateItems(moveItem(items, item.id, -1))}
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Move break down"
                        title="Move down"
                        disabled={rowIndex === visibleItems.length - 1}
                        onClick={() => updateItems(moveItem(items, item.id, 1))}
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label="Remove break"
                        title="Remove break"
                        onClick={() => updateItems(items.filter((candidate) => candidate.id !== item.id))}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <DurationControl
                        item={item}
                        items={items}
                        max={getMaximumFor(item)}
                        onAdjust={(direction) => updateItems(adjustDuration(items, item.id, direction))}
                        onSet={(minutes) => setDuration(item.id, minutes)}
                      />
                    </div>
                  </div>
                );
              }

              const activityIndex = activityItems.findIndex((candidate) => candidate.id === item.id);
              const hasFollowingBreak = items[items.findIndex((candidate) => candidate.id === item.id) + 1]?.kind === 'break';
              const canAddBreak = !hasFollowingBreak && remainingMinutes >= 1;
              const moveActivityRow = (direction: -1 | 1) => updateItems(mode === 'timed'
                ? moveItem(items, item.id, direction)
                : moveActivity(items, item.id, direction));
              return (
                <div key={item.id}>
                  <div
                    className="rounded-md border border-slate-200 bg-white p-2"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropItem(item.id, event)}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <PictogramPicker
                        icon={item.icon}
                        imageId={item.imageId}
                        onChange={(value) => pickActivityPictogram(item.id, value)}
                      />
                      <input
                        type="text"
                        aria-label={`Activity ${activityIndex + 1} name`}
                        placeholder="Activity name"
                        value={item.title}
                        onChange={(event) => patchActivity(item.id, { title: event.target.value })}
                        className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag to reorder ${item.title || `activity ${activityIndex + 1}`}`}
                        title="Drag to reorder"
                        className={`${iconButtonClass} cursor-grab active:cursor-grabbing`}
                        onDragStart={(event) => {
                          dragId.current = item.id;
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', item.id);
                        }}
                        onDragEnd={() => { dragId.current = null; }}
                      >
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Move ${item.title || `activity ${activityIndex + 1}`} up`}
                        title="Move up"
                        disabled={mode === 'timed' ? rowIndex === 0 : activityIndex === 0}
                        onClick={() => moveActivityRow(-1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Move ${item.title || `activity ${activityIndex + 1}`} down`}
                        title="Move down"
                        disabled={mode === 'timed'
                          ? rowIndex === visibleItems.length - 1
                          : activityIndex === activityItems.length - 1}
                        onClick={() => moveActivityRow(1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        aria-label={`Remove ${item.title || `activity ${activityIndex + 1}`}`}
                        title="Remove activity"
                        onClick={() => updateItems(removeActivity(items, item.id))}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {mode === 'timed' && (
                      <div className="ml-10 mt-2 flex flex-wrap items-end gap-2">
                        <DurationControl
                          item={item}
                          items={items}
                          max={getMaximumFor(item)}
                          onAdjust={(direction) => updateItems(adjustDuration(items, item.id, direction))}
                          onSet={(minutes) => setDuration(item.id, minutes)}
                        />
                        {canAddBreak && (
                          <button
                            type="button"
                            className="inline-flex min-h-8 min-w-0 items-center gap-1 rounded px-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                            aria-label={`Add break after ${item.title || `activity ${activityIndex + 1}`}`}
                            title="Add a 30-minute break after this activity"
                            onClick={() => updateItems(addBreakAfterActivity(
                              items,
                              item.id,
                              newId(),
                              Math.min(DEFAULT_BREAK_MINUTES, Math.floor(remainingMinutes)),
                            ))}
                          >
                            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">Add break</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {activityItems.length === 0 && (
              <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                No activities yet.
              </p>
            )}
            <button
              type="button"
              onClick={addActivity}
              disabled={mode === 'timed' && remainingMinutes < 1}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              title={mode === 'timed' && remainingMinutes < 1 ? 'No room for another activity' : 'Add activity'}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add activity
            </button>
            {mode === 'timed' && totalDurationMinutes(items) > MAX_SCHEDULE_MINUTES && (
              <p role="alert" className="text-xs text-rose-600">The complete schedule is over 24 hours. Reduce durations to use timed mode.</p>
            )}
          </div>
        </SettingsSection>
      </>}
    </WidgetSettingsPanel>
  );
}
