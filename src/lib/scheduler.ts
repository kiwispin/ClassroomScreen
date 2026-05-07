import { useAppStore } from '../store/store';

const formatTime = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const tick = () => {
  const state = useAppStore.getState();
  if (!state.scheduleEnabled || state.schedule.length === 0) return;

  const now = new Date();
  const day = now.getDay();
  const time = formatTime(now);

  for (const rule of state.schedule) {
    if (!rule.daysOfWeek.includes(day)) continue;
    if (rule.startTime !== time) continue;
    // Don't reload if we're already on the rule's preset.
    if (state.activePresetId === rule.presetId) continue;
    // Don't load a preset that no longer exists.
    if (!state.presets.some((p) => p.id === rule.presetId)) continue;

    state.switchToPreset(rule.presetId);
    return; // first match wins
  }
};

let started = false;
let intervalId: number | null = null;
let alignTimeoutId: number | null = null;

// Align to the top of the next minute so ticks fire at HH:MM:00 cleanly.
export const startScheduler = () => {
  if (started) return;
  started = true;

  const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
  alignTimeoutId = window.setTimeout(() => {
    tick();
    intervalId = window.setInterval(tick, 60_000);
  }, msUntilNextMinute);
};

export const stopScheduler = () => {
  started = false;
  if (alignTimeoutId != null) {
    window.clearTimeout(alignTimeoutId);
    alignTimeoutId = null;
  }
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
};

// Exposed for tests.
export const _tickForTest = tick;
