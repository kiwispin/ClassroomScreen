export type TimerState = {
  running: boolean;
  durationMs: number;
  startedAt: number | null;
};

export const parseMmss = (s: string): number | null => {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60_000 + Number(m[2]) * 1_000;
};

export const formatMmss = (ms: number): string => {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const remainingMs = (st: TimerState, now: number): number => {
  if (!st.running || st.startedAt == null) return st.durationMs;
  const elapsed = now - st.startedAt;
  return Math.max(0, st.durationMs - elapsed);
};
