import { useRef } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import { useAppStore } from '../../store/store';
import { putImage, deleteImage } from './idb';
import { resizeImage } from './resize';

const SOLID_PRESETS = [
  '#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff', '#0f172a', '#ffffff',
];
const GRADIENT_PRESETS = [
  'linear-gradient(135deg,#fbcfe8,#e0e7ff)',
  'linear-gradient(135deg,#bbf7d0,#bae6fd)',
  'linear-gradient(180deg,#fde68a,#fb7185)',
  'linear-gradient(135deg,#1e293b,#0f172a)',
];

export default function BackgroundPicker() {
  const bg = useAppStore((s) => s.current.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    const id = await putImage(resized);
    if (bg.kind === 'image') {
      try { await deleteImage(bg.imageId); } catch { /* ignore */ }
    }
    setBackground({ kind: 'image', imageId: id, fit: 'cover' });
    e.target.value = '';
  };

  return (
    <SettingsPopover
      trigger={(open) => (
        <button
          onClick={open}
          className="h-9 px-3 rounded hover:bg-slate-100 text-sm flex items-center gap-1"
          title="Background"
        >
          🖌️ <span>Background</span>
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-3 w-72">
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Solid</div>
            <div className="flex gap-2 flex-wrap">
              {SOLID_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBackground({ kind: 'solid', color: c })}
                  className="h-8 w-8 rounded border border-slate-300"
                  style={{ backgroundColor: c }}
                  aria-label={`Solid ${c}`}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Gradient</div>
            <div className="flex gap-2 flex-wrap">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g}
                  onClick={() => setBackground({ kind: 'gradient', css: g })}
                  className="h-8 w-12 rounded border border-slate-300"
                  style={{ backgroundImage: g }}
                  aria-label="Gradient preset"
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 mb-1">Image</div>
            <button
              onClick={() => fileInput.current?.click()}
              className="px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
            >
              Upload image…
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
            {bg.kind === 'image' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <label>Fit</label>
                <select
                  value={bg.fit}
                  onChange={(e) =>
                    setBackground({
                      kind: 'image',
                      imageId: bg.imageId,
                      fit: e.target.value as 'cover' | 'contain',
                    })
                  }
                  className="border border-slate-300 rounded px-1 py-0.5"
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </SettingsPopover>
  );
}
