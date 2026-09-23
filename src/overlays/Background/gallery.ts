import type { AppState } from '../../store/types';
import { collectReferencedImageIds } from './cleanup';
import { deleteImage } from './idb';

export const matchesLocalSearch = (query: string, values: string[]): boolean => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return values.some((value) => value.toLocaleLowerCase().includes(needle));
};

export const tagsFromFileName = (name: string): string[] =>
  name
    .replace(/\.[^.]+$/, '')
    .split(/[\s_-]+/)
    .map((tag) => tag.trim().toLocaleLowerCase())
    .filter(Boolean);

export const deleteSavedUpload = async (
  id: string,
  state: Pick<AppState, 'current' | 'presets'>,
  removeMetadata: (id: string) => void,
  removeFromStorage: (id: string) => Promise<void> = deleteImage,
): Promise<boolean> => {
  const retainedForReference = collectReferencedImageIds(state).has(id);
  if (!retainedForReference) await removeFromStorage(id);
  removeMetadata(id);
  return retainedForReference;
};
