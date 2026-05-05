import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  putAudio,
  getAudio,
  deleteAudio,
  listAudioKeys,
  collectReferencedAudioIds,
  pruneOrphanAudio,
} from './audio-storage';

const file = (name: string, type = 'audio/mpeg', body = 'x') =>
  new File([body], name, { type });

beforeEach(async () => {
  // fake-indexeddb persists across tests in the same file; reset audio store.
  for (const k of await listAudioKeys()) await deleteAudio(k);
});

describe('audio-storage put/get/delete', () => {
  it('round-trips a file', async () => {
    const f = file('chime.mp3', 'audio/mpeg', 'hello');
    const { id, name } = await putAudio(f);
    expect(typeof id).toBe('string');
    expect(name).toBe('chime.mp3');

    const back = await getAudio(id);
    expect(back).toBeDefined();
    expect(back!.name).toBe('chime.mp3');
    expect(back!.blob.type).toBe('audio/mpeg');
    expect(await back!.blob.text()).toBe('hello');
  });

  it('deletes', async () => {
    const { id } = await putAudio(file('a.mp3'));
    await deleteAudio(id);
    expect(await getAudio(id)).toBeUndefined();
  });
});

describe('collectReferencedAudioIds', () => {
  it('finds ids on Timer widgets in current + presets', () => {
    const state = {
      current: {
        widgets: [
          { type: 'timer', config: { customSoundId: 'a' } },
          { type: 'clock', config: {} },
        ],
      },
      presets: [
        {
          state: {
            widgets: [
              { type: 'timer', config: { customSoundId: 'b' } },
              { type: 'timer', config: {} }, // no custom
            ],
          },
        },
      ],
    };
    expect(collectReferencedAudioIds(state)).toEqual(new Set(['a', 'b']));
  });
});

describe('pruneOrphanAudio', () => {
  it('removes IDB entries that are not referenced', async () => {
    const used = await putAudio(file('used.mp3'));
    const orphan = await putAudio(file('orphan.mp3'));

    const state = {
      current: {
        widgets: [
          { type: 'timer', config: { customSoundId: used.id } },
        ],
      },
      presets: [],
    };
    const removed = await pruneOrphanAudio(state);
    expect(removed).toBe(1);
    expect(await getAudio(orphan.id)).toBeUndefined();
    expect(await getAudio(used.id)).toBeDefined();
  });
});
