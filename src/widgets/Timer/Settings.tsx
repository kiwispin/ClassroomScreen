import { useEffect, useRef, useState } from 'react';
import { Music2, Play, Trash2, Upload, Volume2 } from 'lucide-react';
import WidgetSettingsPanel, {
  SettingsSection,
  SettingsToggle,
} from '../../components/WidgetSettingsPanel';
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
import { TIMER_WARNING_OPTIONS } from './logic';
import type { TimerConfig, TimerSfx, TimerWarningSfx } from '.';

export default function TimerSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as TimerConfig;
  const fullMs = cfg.fullDurationMs ?? 5 * 60_000;
  const [draft, setDraft] = useState(formatMmss(fullMs));
  const sfx: TimerSfx = cfg.sfx ?? 'bell';
  const warningMinutes = cfg.warningMinutes ?? [];
  const warningSfx: TimerWarningSfx = cfg.warningSfx ?? 'chime';
  const customId = cfg.customSoundId;
  const customName = cfg.customSoundName;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const warningSounds: Array<{ value: TimerWarningSfx; label: string }> = [
    { value: 'none', label: 'Visual only' },
    ...SFX_NAMES.map((name) => ({ value: name, label: name })),
    ...(customId ? [{ value: 'custom' as const, label: customName ?? 'Custom sound' }] : []),
  ];

  useEffect(() => {
    setDraft(formatMmss(fullMs));
  }, [fullMs]);

  const commit = () => {
    const ms = parseMmss(draft);
    if (ms == null) {
      setDraft(formatMmss(fullMs));
      return;
    }
    if (ms === fullMs) {
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
    updateConfig(instance.id, { sfx: n });
    playSfx(n);
  };

  const pickCustomFinish = () => {
    if (customId) updateConfig(instance.id, { sfx: 'custom' });
  };

  const previewSound = () => {
    if (sfx === 'custom') {
      if (customId) playCustomAudio(customId);
    } else {
      playSfx(sfx);
    }
  };

  const previewWarningSound = () => {
    if (warningSfx === 'none') return;
    if (warningSfx === 'custom') {
      if (customId) playCustomAudio(customId);
    } else {
      playSfx(warningSfx);
    }
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
      ...(sfx === 'custom' ? { sfx: 'bell' as const } : {}),
      ...(warningSfx === 'custom' ? { warningSfx: 'chime' as const } : {}),
      customSoundId: undefined,
      customSoundName: undefined,
    });
  };

  const toggleWarning = (minutes: number) => {
    const next = warningMinutes.includes(minutes)
      ? warningMinutes.filter((value) => value !== minutes)
      : [...warningMinutes, minutes].sort((a, b) => b - a);
    updateConfig(instance.id, { warningMinutes: next });
  };

  return (
    <WidgetSettingsPanel
      title="Timer settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton
          open={toggle}
          label="Timer settings"
          expanded={open}
          controls={panelId}
        />
      )}
    >
      {() => <>
        <SettingsSection title="Duration">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Time (MM:SS)</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Duration (MM:SS)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </SettingsSection>

        <SettingsSection title="Sound">
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Timer sound</span>
              <select
                aria-label="Timer sound"
                value={sfx}
                onChange={(event) => {
                  const value = event.target.value as TimerSfx;
                  if (value === 'custom') pickCustomFinish();
                  else pickSynth(value);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {SFX_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                {(sfx === 'custom' || customId) && (
                  <option value="custom">{customName ?? 'Custom sound'}</option>
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={previewSound}
              disabled={sfx === 'custom' && !customId}
              aria-label="Preview selected sound"
              title="Preview selected sound"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Time warnings">
          <div className="grid grid-cols-3 gap-2">
              {TIMER_WARNING_OPTIONS.map((minutes) => (
                <label
                  key={minutes}
                  className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50"
                >
                  <input
                    type="checkbox"
                    checked={warningMinutes.includes(minutes)}
                    onChange={() => toggleWarning(minutes)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  {minutes} min
                </label>
              ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="font-medium text-slate-700">Warning sound</span>
              <select
                aria-label="Warning sound"
                value={warningSfx}
                onChange={(e) =>
                  updateConfig(instance.id, { warningSfx: e.target.value as TimerWarningSfx })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {warningSounds.map((sound) => (
                  <option key={sound.value} value={sound.value}>{sound.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={previewWarningSound}
              disabled={warningSfx === 'none' || (warningSfx === 'custom' && !customId)}
              aria-label="Preview warning sound"
              title="Preview warning sound"
              className="mb-px flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Custom sound">
          {customId ? (
            <div className="flex items-center gap-2">
              <div
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800"
                title={customName ?? 'Custom sound'}
              >
                <Music2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{customName ?? 'Custom sound'}</span>
              </div>
              <button
                type="button"
                onClick={() => playCustomAudio(customId)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                aria-label="Preview custom sound"
                title="Preview"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={removeCustom}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                aria-label="Remove custom sound"
                title="Remove custom sound"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-700 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? 'Uploading…' : 'Upload sound'}
              </button>
              <p className="text-xs text-slate-500">MP3, OGG, WAV, or M4A. Stored on this device.</p>
            </>
          )}
          {uploadError && <p className="text-xs text-rose-600" role="alert">{uploadError}</p>}
          <input
            ref={fileInput}
            type="file"
            accept="audio/*,.mp3,.ogg,.oga,.wav,.m4a"
            className="hidden"
            onChange={onFile}
          />
        </SettingsSection>

        <SettingsSection title="Timer behavior">
          <SettingsToggle
            label="Auto-reset on zero"
            checked={cfg.autoReset ?? false}
            onChange={(autoReset) => updateConfig(instance.id, { autoReset })}
          />
        </SettingsSection>
      </>}
    </WidgetSettingsPanel>
  );
}
