import { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Trash2, Upload, Volume1, X } from 'lucide-react';
import { useAppStore } from '../store/store';
import { deleteAudio, putAudio } from '../lib/audio-storage';
import {
  isBackgroundMusicPlaying,
  playBackgroundMusic,
  setBackgroundMusicVolume,
  subscribeBackgroundMusic,
  stopBackgroundMusic,
} from '../lib/background-music';
import SettingsPopover from './SettingsPopover';
import ToolButton from './ToolButton';

type Props = {
  variant?: 'bar' | 'popover';
};

export default function BackgroundMusicControl({ variant = 'bar' }: Props) {
  const musicId = useAppStore((s) => s.backgroundMusicId);
  const musicName = useAppStore((s) => s.backgroundMusicName);
  const volume = useAppStore((s) => s.backgroundMusicVolume ?? 0.55);
  const setBackgroundMusic = useAppStore((s) => s.setBackgroundMusic);
  const storeVolume = useAppStore((s) => s.setBackgroundMusicVolume);
  const clearBackgroundMusic = useAppStore((s) => s.clearBackgroundMusic);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(isBackgroundMusicPlaying());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeBackgroundMusic(setPlaying), []);
  useEffect(() => setBackgroundMusicVolume(volume), [volume]);

  const uploadFile = async (file: File) => {
    setError(null);
    if (!/^audio\//i.test(file.type)) {
      setError('Choose an audio file.');
      return;
    }

    setUploading(true);
    try {
      stopBackgroundMusic();
      setPlaying(false);
      if (musicId) {
        try { await deleteAudio(musicId); } catch { /* ignore */ }
      }
      const saved = await putAudio(file);
      setBackgroundMusic(saved.id, saved.name);
    } catch (err) {
      setError((err as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      uploadFile(file);
    }
  };

  const togglePlay = async () => {
    setError(null);
    if (!musicId) {
      fileInput.current?.click();
      return;
    }

    if (isBackgroundMusicPlaying()) {
      stopBackgroundMusic();
      setPlaying(false);
      return;
    }

    const started = await playBackgroundMusic(musicId, volume);
    setPlaying(started);
    if (!started) setError('Playback was blocked or the file is missing.');
  };

  const remove = async () => {
    stopBackgroundMusic();
    setPlaying(false);
    if (musicId) {
      try { await deleteAudio(musicId); } catch { /* ignore */ }
    }
    clearBackgroundMusic();
  };

  return (
    <SettingsPopover
      arrow
      panelClassName="overflow-visible p-0"
      trigger={(open, popoverOpen) => (
        <ToolButton
          Icon={Music}
          label="music"
          title="Background music"
          active={popoverOpen || playing}
          iconColor="text-sky-600"
          variant={variant}
          onClick={open}
        />
      )}
    >
      {(close) => (
        <div className="w-[min(24rem,calc(100vw-24px))] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Music className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">Background music</div>
                <div className="truncate text-xs text-slate-500">
                  {musicName ?? 'No track selected'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close background music"
              title="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="truncate rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
              title={musicName ?? 'No music selected'}
            >
              {musicName ?? 'No music selected'}
            </div>

            <label className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Volume1 className="h-4 w-4 text-indigo-500" strokeWidth={2.2} />
                  <span>Volume</span>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(volume * 100)}
                onChange={(event) => storeVolume(Number(event.target.value) / 100)}
                className="block h-2 w-full cursor-pointer accent-indigo-500"
                aria-label="Background music volume"
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={togglePlay}
                disabled={uploading}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? 'Stop' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {musicId ? 'Replace' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={!musicId || uploading}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            {error && <p className="text-[11px] text-rose-600">{error}</p>}
            <input
              ref={fileInput}
              type="file"
              accept="audio/*,.mp3,.ogg,.oga,.wav,.m4a"
              className="hidden"
              onChange={onFile}
            />
          </div>
        </div>
      )}
    </SettingsPopover>
  );
}
