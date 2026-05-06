import { useRef } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import { putImage, deleteImage } from '../../overlays/Background/idb';
import { resizeImage } from '../../overlays/Background/resize';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { ImageEmbedConfig } from '.';

export default function ImageEmbedSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as ImageEmbedConfig;
  const fileInput = useRef<HTMLInputElement | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const id = await putImage(resized);
    if (cfg.source === 'upload' && cfg.imageId) {
      try { await deleteImage(cfg.imageId); } catch { /* ignore */ }
    }
    updateConfig(instance.id, { source: 'upload', imageId: id });
    e.target.value = '';
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Image settings" />
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <div className="flex gap-1">
            <button
              onClick={() => updateConfig(instance.id, { source: 'url' })}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                ((cfg.source ?? 'url') === 'url' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              From URL
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              className={
                'flex-1 px-2 py-1 rounded text-xs ' +
                (cfg.source === 'upload' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
              }
            >
              Upload
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </div>
          {(cfg.source ?? 'url') === 'url' && (
            <label className="flex flex-col gap-1">
              <span>Image URL</span>
              <input
                type="url"
                value={cfg.url ?? ''}
                onChange={(e) => updateConfig(instance.id, { url: e.target.value })}
                placeholder="https://…"
                className="border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </label>
          )}
          <label className="flex items-center justify-between gap-3">
            <span>Fit</span>
            <select
              value={cfg.fit ?? 'contain'}
              onChange={(e) =>
                updateConfig(instance.id, { fit: e.target.value as 'cover' | 'contain' })
              }
              className="border border-slate-300 rounded px-1 py-0.5 text-sm"
            >
              <option value="contain">contain</option>
              <option value="cover">cover</option>
            </select>
          </label>
        </div>
      )}
    </SettingsPopover>
  );
}
