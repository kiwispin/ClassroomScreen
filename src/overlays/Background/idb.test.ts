import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { putImage, getImage, deleteImage } from './idb';

describe('image idb store', () => {
  it('round-trips a blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const id = await putImage(blob);
    expect(typeof id).toBe('string');

    const back = await getImage(id);
    expect(back).toBeInstanceOf(Blob);
    expect(back!.type).toBe('text/plain');
    const text = await back!.text();
    expect(text).toBe('hello');
  });

  it('deletes a blob', async () => {
    const blob = new Blob(['x']);
    const id = await putImage(blob);
    await deleteImage(id);
    const back = await getImage(id);
    expect(back).toBeUndefined();
  });
});
