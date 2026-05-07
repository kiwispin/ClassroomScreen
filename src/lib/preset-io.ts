import { useAppStore } from '../store/store';
import { getImage, putImage } from '../overlays/Background/idb';
import { getAudio, putAudio } from './audio-storage';
import { newId } from './uuid';
import type { Preset, ScreenState } from '../store/types';

const FORMAT = 'classroomscreen-presets' as const;
const FORMAT_VERSION = 1;

type ExportImage = { id: string; type: string; dataB64: string };
type ExportAudio = { id: string; type: string; name: string; dataB64: string };

export type ExportBundle = {
  format: typeof FORMAT;
  version: number;
  exportedAt: number;
  presets: Preset[];
  images: ExportImage[];
  audio: ExportAudio[];
};

export type ImportResult = {
  presetsAdded: number;
  imagesAdded: number;
  audioAdded: number;
};

// --- base64 codec ----------------------------------------------------------
//
// Naive `btoa(String.fromCharCode(...bytes))` blows the stack on large blobs;
// chunking keeps us safe for multi-megabyte images / audio.

const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
};

const base64ToBlob = (b64: string, type: string): Blob => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
};

// --- referenced-asset collection ------------------------------------------

export const collectImageIds = (presets: Preset[]): Set<string> => {
  const ids = new Set<string>();
  for (const p of presets) {
    if (p.state.background.kind === 'image') ids.add(p.state.background.imageId);
    for (const w of p.state.widgets) {
      if (w.type === 'image') {
        const c = w.config as { source?: string; imageId?: string };
        if (c.source === 'upload' && typeof c.imageId === 'string') {
          ids.add(c.imageId);
        }
      }
    }
  }
  return ids;
};

export const collectAudioIds = (presets: Preset[]): Set<string> => {
  const ids = new Set<string>();
  for (const p of presets) {
    for (const w of p.state.widgets) {
      if (w.type === 'timer') {
        const c = w.config as { customSoundId?: string };
        if (typeof c.customSoundId === 'string') ids.add(c.customSoundId);
      }
    }
  }
  return ids;
};

// --- export ----------------------------------------------------------------

export const buildExportBundle = async (presets: Preset[]): Promise<ExportBundle> => {
  const imageIds = collectImageIds(presets);
  const images: ExportImage[] = [];
  for (const id of imageIds) {
    const blob = await getImage(id);
    if (!blob) continue;
    images.push({
      id,
      type: blob.type || 'image/jpeg',
      dataB64: arrayBufferToBase64(await blob.arrayBuffer()),
    });
  }

  const audioIds = collectAudioIds(presets);
  const audio: ExportAudio[] = [];
  for (const id of audioIds) {
    const got = await getAudio(id);
    if (!got) continue;
    audio.push({
      id,
      type: got.blob.type || 'audio/mpeg',
      name: got.name,
      dataB64: arrayBufferToBase64(await got.blob.arrayBuffer()),
    });
  }

  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: Date.now(),
    presets: JSON.parse(JSON.stringify(presets)),
    images,
    audio,
  };
};

export const exportToFile = async (): Promise<void> => {
  const presets = useAppStore.getState().presets;
  if (presets.length === 0) {
    throw new Error('No presets to export.');
  }
  const bundle = await buildExportBundle(presets);
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `classroomscreen-presets-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// --- import ----------------------------------------------------------------

const remapScreenState = (
  state: ScreenState,
  imageIdMap: Map<string, string>,
  audioIdMap: Map<string, string>,
): ScreenState => {
  let background = state.background;
  if (background.kind === 'image') {
    const replaced = imageIdMap.get(background.imageId);
    if (replaced) background = { ...background, imageId: replaced };
  }

  const widgets = state.widgets.map((w) => {
    if (w.type === 'image') {
      const c = w.config as { source?: string; imageId?: string };
      if (c.source === 'upload' && c.imageId) {
        const replaced = imageIdMap.get(c.imageId);
        if (replaced) return { ...w, config: { ...w.config, imageId: replaced } };
      }
    }
    if (w.type === 'timer') {
      const c = w.config as { customSoundId?: string };
      if (c.customSoundId) {
        const replaced = audioIdMap.get(c.customSoundId);
        if (replaced) return { ...w, config: { ...w.config, customSoundId: replaced } };
      }
    }
    return w;
  });

  return { background, widgets };
};

export const importFromBundle = async (bundle: ExportBundle): Promise<ImportResult> => {
  if (bundle.format !== FORMAT) {
    throw new Error('Not a ClassroomScreen presets file.');
  }
  if (bundle.version !== FORMAT_VERSION) {
    throw new Error(`Unsupported format version ${bundle.version}.`);
  }

  // Rewrite IDs so imported assets never collide with the user's existing ones.
  const imageIdMap = new Map<string, string>();
  for (const img of bundle.images) {
    const newImgId = await putImage(base64ToBlob(img.dataB64, img.type));
    imageIdMap.set(img.id, newImgId);
  }

  const audioIdMap = new Map<string, string>();
  for (const a of bundle.audio) {
    const file = new File([base64ToBlob(a.dataB64, a.type)], a.name, { type: a.type });
    const { id: newAudioId } = await putAudio(file);
    audioIdMap.set(a.id, newAudioId);
  }

  const remapped: Preset[] = bundle.presets.map((p) => ({
    ...p,
    id: newId(),
    state: remapScreenState(p.state, imageIdMap, audioIdMap),
  }));

  const store = useAppStore.getState();
  useAppStore.setState({
    presets: [...store.presets, ...remapped],
  });

  return {
    presetsAdded: remapped.length,
    imagesAdded: bundle.images.length,
    audioAdded: bundle.audio.length,
  };
};

export const importFromFile = async (file: File): Promise<ImportResult> => {
  const text = await file.text();
  let bundle: ExportBundle;
  try {
    bundle = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  return importFromBundle(bundle);
};
