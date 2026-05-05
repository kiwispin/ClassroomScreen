export type StopwatchState = {
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

export const elapsedMs = (st: StopwatchState, now: number): number => {
  if (!st.running || st.startedAt == null) return st.accumulatedMs;
  return st.accumulatedMs + Math.max(0, now - st.startedAt);
};

export const formatStopwatch = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
