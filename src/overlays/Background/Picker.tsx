import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, ImagePlus, LoaderCircle, Palette, Search, Trash2, X } from 'lucide-react';
import WidgetSettingsPanel, { SettingsSection } from '../../components/WidgetSettingsPanel';
import ToolButton from '../../components/ToolButton';
import { useAppStore } from '../../store/store';
import { DEFAULT_BACKGROUND, type Background, type SavedBackgroundUpload } from '../../store/types';
import { deleteSavedUpload, matchesLocalSearch, tagsFromFileName } from './gallery';
import { getImage, putImage } from './idb';
import { resizeImage } from './resize';
import { BACKGROUND_CATEGORIES, type CuratedBackground } from './catalog';

const SOLID_PRESETS = [
  '#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff', '#0f172a', '#ffffff',
];
const GRADIENT_PRESETS = [
  'linear-gradient(135deg,#fbcfe8,#e0e7ff)',
  'linear-gradient(135deg,#bbf7d0,#bae6fd)',
  'linear-gradient(180deg,#fde68a,#fb7185)',
  'linear-gradient(135deg,#1e293b,#0f172a)',
];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const EMPTY_UPLOADS: SavedBackgroundUpload[] = [];

type UploadPreviews = {
  urls: Map<string, string>;
  missing: Set<string>;
  failed: Set<string>;
  loading: boolean;
};

const emptyPreviews = (): UploadPreviews => ({
  urls: new Map(),
  missing: new Set(),
  failed: new Set(),
  loading: false,
});

const selectedUpload = (background: Background, id: string) =>
  background.kind === 'image' && background.imageId === id;

const selectedPhoto = (background: Background, id: string) =>
  background.kind === 'preset-image' && background.assetId === id;

function CuratedPhotoTile({
  photo,
  selected,
  onSelect,
}: {
  photo: CuratedBackground;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className="min-w-0">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${photo.title} background`}
        aria-pressed={selected}
        className={`group relative block aspect-[16/9] w-full overflow-hidden rounded border bg-slate-100 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${selected ? 'ring-2 ring-indigo-500' : 'border-slate-300 hover:border-slate-500'}`}
      >
        <img
          src={photo.thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          loading="lazy"
        />
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow" aria-hidden="true">
            <Check className="h-4 w-4" />
          </span>
        )}
      </button>
      <div className="mt-1.5 min-w-0">
        <div className="truncate text-xs font-medium text-slate-800" title={photo.title}>{photo.title}</div>
        <a
          href={photo.source}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[11px] leading-4 text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
          title={`Photo by ${photo.author} on Pexels`}
        >
          Photo by {photo.author} · Pexels
        </a>
      </div>
    </article>
  );
}

export default function BackgroundPicker() {
  const background = useAppStore((s) => s.current.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const storedUploads = useAppStore((s) => s.backgroundUploads);
  const addBackgroundUpload = useAppStore((s) => s.addBackgroundUpload);
  const removeBackgroundUpload = useAppStore((s) => s.removeBackgroundUpload);
  const uploads = storedUploads ?? EMPTY_UPLOADS;
  const currentUploadId = background.kind === 'image' ? background.imageId : null;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [previews, setPreviews] = useState<UploadPreviews>(emptyPreviews);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    setPreviews({ ...emptyPreviews(), loading: uploads.length > 0 });

    void (async () => {
      const urls = new Map<string, string>();
      const missing = new Set<string>();
      const failed = new Set<string>();
      for (const upload of uploads) {
        try {
          const blob = await getImage(upload.id);
          if (cancelled) return;
          if (!blob) {
            missing.add(upload.id);
            continue;
          }
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          urls.set(upload.id, url);
        } catch {
          if (cancelled) return;
          failed.add(upload.id);
        }
      }
      if (!cancelled) setPreviews({ urls, missing, failed, loading: false });
    })();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploads]);

  useEffect(() => {
    if (!currentUploadId || uploads.some((upload) => upload.id === currentUploadId)) return;
    let cancelled = false;
    void getImage(currentUploadId).then(() => {
      if (!cancelled) {
        addBackgroundUpload({
          id: currentUploadId,
          name: 'Previous background upload',
          tags: [],
          addedAt: Date.now(),
        });
      }
    }).catch(() => {
      if (!cancelled) {
        addBackgroundUpload({
          id: currentUploadId,
          name: 'Previous background upload',
          tags: [],
          addedAt: Date.now(),
        });
        setNotice('The previous background is unavailable. Upload the original image again to restore it.');
      }
    });
    return () => { cancelled = true; };
  }, [currentUploadId, uploads, addBackgroundUpload]);

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;

    setBusy(true);
    setNotice(`Preparing ${files.length} ${files.length === 1 ? 'image' : 'images'}…`);
    let saved = 0;
    let firstSavedId: string | null = null;
    const failures: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        failures.push(`${file.name}: choose an image file.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        failures.push(`${file.name}: the file is over 20 MB.`);
        continue;
      }
      try {
        const resized = await resizeImage(file);
        const id = await putImage(resized);
        addBackgroundUpload({
          id,
          name: file.name,
          tags: tagsFromFileName(file.name),
          addedAt: Date.now(),
        });
        firstSavedId ??= id;
        saved += 1;
      } catch {
        failures.push(`${file.name}: this image could not be read. Try another image.`);
      }
    }

    if (firstSavedId) setBackground({ kind: 'image', imageId: firstSavedId, fit: 'cover' });
    setBusy(false);
    setNotice([
      saved ? `Saved ${saved} ${saved === 1 ? 'image' : 'images'} to My uploads.` : '',
      ...failures,
    ].filter(Boolean).join(' '));
  };

  const onDeleteUpload = async (id: string) => {
    setDeletingId(id);
    setNotice('');
    try {
      const beforeDelete = useAppStore.getState();
      if (beforeDelete.current.background.kind === 'image' && beforeDelete.current.background.imageId === id) {
        beforeDelete.setBackground(DEFAULT_BACKGROUND);
      }
      const remainsInUse = await deleteSavedUpload(
        id,
        useAppStore.getState(),
        removeBackgroundUpload,
      );
      setNotice(remainsInUse
        ? 'Removed from My uploads. It remains available to the current screen, a preset, or a widget that uses it.'
        : 'Image removed from My uploads.');
    } catch {
      setNotice('Could not remove this image. It is still saved; try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUploads = uploads.filter((upload) =>
    matchesLocalSearch(query, [upload.name, ...upload.tags]),
  );
  const filteredCategories = BACKGROUND_CATEGORIES.map((category) => ({
    ...category,
    photos: category.photos.filter((photo) =>
      matchesLocalSearch(query, [photo.title, photo.category, ...photo.tags]),
    ),
  })).filter((category) => category.photos.length > 0);
  const canSetFit = background.kind === 'image' || background.kind === 'preset-image';

  const changeFit = (fit: 'cover' | 'contain') => {
    if (background.kind === 'image' || background.kind === 'preset-image') {
      setBackground({ ...background, fit });
    }
  };

  return (
    <WidgetSettingsPanel
      title="Background"
      TitleIcon={Palette}
      widthClassName="w-[min(32.5rem,calc(100vw-24px))]"
      trigger={(toggle, open) => (
        <ToolButton
          Icon={Palette}
          label="background"
          title="Background"
          active={open}
          iconColor="text-pink-500"
          onClick={toggle}
        />
      )}
    >
      {() => (
        <div className="pb-3">
          <div className="sticky top-0 z-10 bg-white pb-3 pt-3">
            <label className="sr-only" htmlFor="background-search">Search backgrounds</label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                id="background-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search names or tags"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" title="Clear search" className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <SettingsSection title="My uploads">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={busy}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-slate-400 bg-slate-50 text-slate-600 hover:border-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-wait disabled:opacity-60"
                  aria-label="Add images to My uploads"
                >
                  {busy ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
                  <span className="text-xs font-medium">{busy ? 'Adding…' : 'Add photos'}</span>
                </button>
                <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                <p className="mt-1.5 truncate text-[11px] text-slate-500" title="Up to 20 MB per image">Up to 20 MB each</p>
              </div>

              {filteredUploads.map((upload) => {
                const selected = selectedUpload(background, upload.id);
                const preview = previews.urls.get(upload.id);
                const unavailable = previews.missing.has(upload.id) || previews.failed.has(upload.id);
                return (
                  <article key={upload.id} className="group relative min-w-0">
                    <button
                      type="button"
                      onClick={() => preview && setBackground({ kind: 'image', imageId: upload.id, fit: 'cover' })}
                      disabled={!preview}
                      aria-label={`Select uploaded background ${upload.name}`}
                      aria-pressed={selected}
                      className={`relative block aspect-[16/9] w-full overflow-hidden rounded border bg-slate-100 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${selected ? 'ring-2 ring-indigo-500' : 'border-slate-300 hover:border-slate-500'}`}
                    >
                      {preview ? (
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-500">
                          {previews.loading ? 'Loading…' : unavailable ? 'Image unavailable' : 'Preparing…'}
                        </span>
                      )}
                      {selected && (
                        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow" aria-hidden="true">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteUpload(upload.id)}
                      disabled={deletingId === upload.id}
                      aria-label={`Delete ${upload.name} from My uploads`}
                      title="Remove from My uploads"
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded bg-white/95 text-slate-700 shadow-sm opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 disabled:opacity-50"
                    >
                      {deletingId === upload.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <p className="mt-1.5 truncate text-xs font-medium text-slate-800" title={upload.name}>{upload.name}</p>
                  </article>
                );
              })}

              {!filteredUploads.length && !!uploads.length && query && (
                <p className="col-span-2 self-center text-xs text-slate-500">No uploads match this search.</p>
              )}
              {!uploads.length && !query && !previews.loading && (
                <p className="col-span-2 self-center text-xs text-slate-500">Your saved images will appear here.</p>
              )}
            </div>
            {notice && (
              <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-slate-600">
                {notice}
              </p>
            )}
          </SettingsSection>

          {filteredCategories.map((category) => (
            <SettingsSection key={category.title} title={category.title}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                {category.photos.map((photo) => (
                  <CuratedPhotoTile
                    key={photo.id}
                    photo={photo}
                    selected={selectedPhoto(background, photo.id)}
                    onSelect={() => setBackground({ kind: 'preset-image', assetId: photo.id, fit: 'cover' })}
                  />
                ))}
              </div>
            </SettingsSection>
          ))}

          {filteredCategories.length > 0 && (
            <div className="border-b border-slate-200 py-3 text-[11px] leading-5 text-slate-500">
              Photos: Pexels ·{' '}
              <a href="https://www.pexels.com/license/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-800">License</a>
              {' · Browse '}
              <a href="https://www.pexels.com/search/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-800">Pexels</a>
              {' or '}
              <a href="https://pixabay.com/images/search/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-800">Pixabay</a>
            </div>
          )}

          {!filteredCategories.length && query && (
            <p className="border-b border-slate-200 py-4 text-xs text-slate-500">No curated photos match this search.</p>
          )}

          <SettingsSection title="Fit">
            {canSetFit ? (
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700">Image fit</span>
                <select
                  value={background.kind === 'image' || background.kind === 'preset-image' ? background.fit : 'cover'}
                  onChange={(event) => changeFit(event.target.value as 'cover' | 'contain')}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                  aria-label="Background image fit"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </label>
            ) : (
              <p className="text-xs text-slate-500">Choose a photo to adjust its fit.</p>
            )}
          </SettingsSection>

          <SettingsSection title="Solid">
            <div className="flex flex-wrap gap-2">
              {SOLID_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBackground({ kind: 'solid', color })}
                  className={`h-8 w-8 rounded border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${background.kind === 'solid' && background.color === color ? 'border-indigo-600 ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-300'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Solid ${color}`}
                  aria-pressed={background.kind === 'solid' && background.color === color}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Gradient">
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((gradient, index) => (
                <button
                  key={gradient}
                  type="button"
                  onClick={() => setBackground({ kind: 'gradient', css: gradient })}
                  className={`h-8 w-12 rounded border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${background.kind === 'gradient' && background.css === gradient ? 'border-indigo-600 ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-300'}`}
                  style={{ backgroundImage: gradient }}
                  aria-label={`Gradient preset ${index + 1}`}
                  aria-pressed={background.kind === 'gradient' && background.css === gradient}
                />
              ))}
            </div>
          </SettingsSection>

        </div>
      )}
    </WidgetSettingsPanel>
  );
}
