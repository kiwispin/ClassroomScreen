import { widgetAssetIsShared } from '../../lib/widget-asset-references';
import { useRef } from 'react';
import WidgetSettingsPanel, { SettingsSection } from '../../components/WidgetSettingsPanel';
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
    if (cfg.source === 'upload' && cfg.imageId && !widgetAssetIsShared(cfg.imageId, 'image', instance.id)) {
      try { await deleteImage(cfg.imageId); } catch { /* ignore */ }
    }
    updateConfig(instance.id, { source: 'upload', imageId: id });
    e.target.value = '';
  };

  return (
    <WidgetSettingsPanel
      title="Image settings"
      trigger={(toggle, open, panelId) => (
        <SettingsTriggerButton open={toggle} label="Image settings" expanded={open} controls={panelId} />
      )}
    >
      {() => (
        <>
        <SettingsSection title="Image source">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => updateConfig(instance.id, { source: 'url' })}
                className={
                  'flex-1 min-h-10 px-3 py-2 rounded-md text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ' +
                  ((cfg.source ?? 'url') === 'url' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400' : 'bg-slate-100 text-slate-700')
                }
              >
                From URL
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className={
                  'flex-1 min-h-10 px-3 py-2 rounded-md text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ' +
                  (cfg.source === 'upload' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400' : 'bg-slate-100 text-slate-700')
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
                  className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            )}
          </div>
        </SettingsSection>
        <SettingsSection title="Display">
            <label className="flex flex-col gap-1">
              <span>Fit</span>
              <select
                value={cfg.fit ?? 'contain'}
                onChange={(e) =>
                  updateConfig(instance.id, { fit: e.target.value as 'cover' | 'contain' })
                }
                className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="contain">Show whole image</option>
                <option value="cover">Fill widget</option>
              </select>
            </label>
        </SettingsSection>
        </>
      )}
    </WidgetSettingsPanel>
  );
}
