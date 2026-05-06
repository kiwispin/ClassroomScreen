import { useRef, useState } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import { SFX_NAMES, playSfx, type SfxName } from '../../lib/audio';
import {
  putAudio,
  deleteAudio,
  playCustomAudio,
} from '../../lib/audio-storage';
import type { WidgetSettingsProps } from '../Demo/meta';
import { parseMmss, formatMmss } from './logic';
import type { TimerConfig, TimerSfx } from '.';

export default function TimerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;
  const fullMs = cfg.fullDurationMs ?? 5 * 60_000;
  const [draft, setDraft] = useState(formatMmss(fullMs));
  const sfx: TimerSfx = cfg.sfx ?? 'bell';
  const customId = cfg.customSoundId;
  const customName = cfg.customSoundName;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const commit = () => {
    const ms = parseMmss(draft);
    if (ms == null) {
      setDraft(formatMmss(fullMs));
      return;
    }
    updateConfig(instance.id, {
      fullDurationMs: ms,
      durationMs: ms,
      running: false,
      startedAt: null,
    });
  };

  const pickSynth = (n: SfxName) => {
    // Switching to a synthesized sound clears any custom file.
    if (customId) {
      deleteAudio(customId).catch(() => { /* ignore */ });
    }
    updateConfig(instance.id, {
      sfx: n,
      customSoundId: undefined,
      customSoundName: undefined,
    });
    playSfx(n);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadError(null);

    // Browser can't decode arbitrary types; gate on common audio MIME types.
    if (!/^audio\//i.test(file.type)) {
      setUploadError('Please choose an audio file (MP3, OGG, WAV, …).');
      return;
    }

    setUploading(true);
    try {
      // Drop the previous custom file, if any.
      if (customId) {
        try { await deleteAudio(customId); } catch { /* ignore */ }
      }
      const { id, name } = await putAudio(file);
      updateConfig(instance.id, {
        sfx: 'custom',
        customSoundId: id,
        customSoundName: name,
      });
    } catch (err) {
      setUploadError((err as Error).message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeCustom = async () => {
    if (customId) {
      try { await deleteAudio(customId); } catch { /* ignore */ }
    }
    updateConfig(instance.id, {
      sfx: 'bell',
      customSoundId: undefined,
      customSoundName: undefined,
    });
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Timer settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <label className="flex flex-col gap-1">
            <span>Duration (MM:SS)</span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()
              }
              className="border border-slate-300 rounded px-2 py-1"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span>Sound</span>
            <div className="flex gap-1 flex-wrap">
              {SFX_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => pickSynth(n)}
                  className={
                    'px-2 py-1 rounded text-xs ' +
                    (sfx === n
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-200 text-slate-700')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-200 pt-2">
            <span className="text-xs uppercase text-slate-500">Custom sound</span>
            {sfx === 'custom' && customId ? (
              <div className="flex items-center gap-1">
                <div
                  className="flex-1 rounded bg-indigo-50 text-indigo-800 text-xs px-2 py-1 truncate"
                  title={customName ?? 'Custom sound'}
                >
                  🎵 {customName ?? 'Custom sound'}
                </div>
                <button
                  onClick={() => playCustomAudio(customId)}
                  className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300"
                  title="Preview"
                >
                  ▶
                </button>
                <button
                  onClick={removeCustom}
                  className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs hover:bg-rose-200"
                  title="Remove custom sound"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload sound (MP3/OGG/WAV)…'}
                </button>
                <p className="text-[11px] text-slate-500">
                  Stored locally on this device.
                </p>
              </>
            )}
            {uploadError && (
              <p className="text-[11px] text-rose-600">{uploadError}</p>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="audio/*,.mp3,.ogg,.oga,.wav,.m4a"
              className="hidden"
              onChange={onFile}
            />
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>Auto-reset on zero</span>
            <input
              type="checkbox"
              checked={cfg.autoReset ?? false}
              onChange={(e) =>
                updateConfig(instance.id, { autoReset: e.target.checked })
              }
            />
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
