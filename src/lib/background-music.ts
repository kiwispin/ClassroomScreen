import { getAudio } from './audio-storage';

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playing = false;
const listeners = new Set<(isPlaying: boolean) => void>();

const setPlaying = (next: boolean) => {
  if (playing === next) return;
  playing = next;
  listeners.forEach((listener) => listener(playing));
};

const cleanup = () => {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  currentAudio = null;
  setPlaying(false);
};

export const stopBackgroundMusic = () => {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  cleanup();
};

export const isBackgroundMusicPlaying = (): boolean =>
  playing;

export const subscribeBackgroundMusic = (
  listener: (isPlaying: boolean) => void,
): (() => void) => {
  listeners.add(listener);
  listener(playing);
  return () => listeners.delete(listener);
};

export const setBackgroundMusicVolume = (volume: number) => {
  if (currentAudio) {
    currentAudio.volume = Math.max(0, Math.min(1, volume));
  }
};

export const playBackgroundMusic = async (
  id: string,
  volume = 0.55,
): Promise<boolean> => {
  stopBackgroundMusic();
  const stored = await getAudio(id);
  if (!stored) return false;

  const url = URL.createObjectURL(stored.blob);
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudio = audio;
  currentUrl = url;

  const onEnd = () => cleanup();
  audio.addEventListener('ended', onEnd, { once: true });
  audio.addEventListener('error', onEnd, { once: true });

  try {
    await audio.play();
    setPlaying(true);
    return true;
  } catch {
    cleanup();
    return false;
  }
};
