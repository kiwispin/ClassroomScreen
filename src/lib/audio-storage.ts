import { get, set, del, keys, createStore } from 'idb-keyval';
import { newId } from './uuid';

const audioStore = createStore('classroomscreen', 'audio');

type StoredAudio = {
  data: ArrayBuffer;
  type: string;
  name: string;
};

export type AudioInfo = { blob: Blob; name: string };

export const putAudio = async (file: File): Promise<{ id: string; name: string }> => {
  const id = newId();
  const data = await file.arrayBuffer();
  const stored: StoredAudio = {
    data,
    type: file.type || 'audio/mpeg',
    name: file.name || 'sound',
  };
  await set(id, stored, audioStore);
  return { id, name: stored.name };
};

export const getAudio = async (id: string): Promise<AudioInfo | undefined> => {
  const stored = await get<StoredAudio>(id, audioStore);
  if (!stored) return undefined;
  return {
    blob: new Blob([stored.data], { type: stored.type }),
    name: stored.name,
  };
};

export const deleteAudio = async (id: string): Promise<void> => {
  await del(id, audioStore);
};

export const listAudioKeys = async (): Promise<string[]> => {
  return (await keys(audioStore)) as string[];
};

// Plays the audio identified by `id` once. Returns a promise that resolves
// when playback starts (or silently if the audio is missing / blocked).
export const playCustomAudio = async (id: string): Promise<void> => {
  const stored = await getAudio(id);
  if (!stored) return;
  const url = URL.createObjectURL(stored.blob);
  const audio = new Audio(url);
  const cleanup = () => {
    URL.revokeObjectURL(url);
  };
  audio.addEventListener('ended', cleanup, { once: true });
  audio.addEventListener('error', cleanup, { once: true });
  try {
    await audio.play();
  } catch {
    cleanup();
  }
};

// Walk the app state and collect every customSoundId referenced by Timer widgets
// (in current + every preset).
type ScreenLike = {
  widgets: Array<{ type: string; config: Record<string, unknown> }>;
};

export const collectReferencedAudioIds = (state: {
  current: ScreenLike;
  presets: Array<{ state: ScreenLike }>;
}): Set<string> => {
  const ids = new Set<string>();
  const collectFrom = (scr: ScreenLike) => {
    for (const w of scr.widgets) {
      if (w.type === 'timer') {
        const c = w.config as { customSoundId?: string };
        if (typeof c.customSoundId === 'string') ids.add(c.customSoundId);
      }
    }
  };
  collectFrom(state.current);
  for (const p of state.presets) collectFrom(p.state);
  return ids;
};

export const pruneOrphanAudio = async (state: {
  current: ScreenLike;
  presets: Array<{ state: ScreenLike }>;
}): Promise<number> => {
  const referenced = collectReferencedAudioIds(state);
  const allKeys = await listAudioKeys();
  let removed = 0;
  for (const key of allKeys) {
    if (!referenced.has(key)) {
      await deleteAudio(key);
      removed += 1;
    }
  }
  return removed;
};
