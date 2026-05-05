import { get, set, del, createStore } from 'idb-keyval';
import { newId } from '../../lib/uuid';

const store = createStore('classroomscreen', 'images');

type StoredImage = {
  data: ArrayBuffer;
  type: string;
};

export const putImage = async (blob: Blob): Promise<string> => {
  const id = newId();
  const data = await blob.arrayBuffer();
  const stored: StoredImage = { data, type: blob.type || 'image/jpeg' };
  await set(id, stored, store);
  return id;
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
  const stored = await get<StoredImage>(id, store);
  if (!stored) return undefined;
  return new Blob([stored.data], { type: stored.type });
};

export const deleteImage = async (id: string): Promise<void> => {
  await del(id, store);
};
