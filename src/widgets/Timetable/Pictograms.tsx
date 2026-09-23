import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Atom,
  Beaker,
  BookOpen,
  Brain,
  Calculator,
  CodeXml,
  Coffee,
  Dumbbell,
  FlaskConical,
  Footprints,
  Globe,
  Heart,
  ImagePlus,
  Keyboard,
  Laptop,
  Landmark,
  Languages,
  Leaf,
  Map as MapIcon,
  Microscope,
  Music,
  Monitor,
  Palette,
  Pencil,
  Smartphone,
  Search,
  Shapes,
  Sparkles,
  SquarePlus,
  Sun,
  Tablet,
  Theater,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '../../store/store';
import { getImage, putImage } from '../../overlays/Background/idb';
import { resizeImage } from '../../overlays/Background/resize';

type PictogramProps = {
  icon?: string;
  imageId?: string;
  className?: string;
};

type PictogramOption = {
  id: string;
  label: string;
  keywords: string;
  accent: string;
  Icon: LucideIcon;
};

const OPTIONS: PictogramOption[] = [
  { id: 'book-open', label: 'Reading', keywords: 'book literacy reading english', accent: '#7dd3fc', Icon: BookOpen },
  { id: 'calculator', label: 'Mathematics', keywords: 'maths math number calculation', accent: '#fde68a', Icon: Calculator },
  { id: 'flask-conical', label: 'Science', keywords: 'science experiment chemistry', accent: '#86efac', Icon: FlaskConical },
  { id: 'atom', label: 'Physics', keywords: 'physics atom science', accent: '#c4b5fd', Icon: Atom },
  { id: 'globe', label: 'Geography', keywords: 'geography world earth', accent: '#f9a8d4', Icon: Globe },
  { id: 'languages', label: 'Languages', keywords: 'language words translation', accent: '#67e8f9', Icon: Languages },
  { id: 'landmark', label: 'History', keywords: 'history social studies building', accent: '#fdba74', Icon: Landmark },
  { id: 'music', label: 'Music', keywords: 'music singing instrument', accent: '#f0abfc', Icon: Music },
  { id: 'palette', label: 'Art', keywords: 'art paint create drawing', accent: '#f9a8d4', Icon: Palette },
  { id: 'drama', label: 'Drama', keywords: 'drama theatre theater performance', accent: '#fda4af', Icon: Theater },
  { id: 'dumbbell', label: 'Physical education', keywords: 'physical education pe sport exercise', accent: '#a5b4fc', Icon: Dumbbell },
  { id: 'leaf', label: 'Nature', keywords: 'nature environment plant biology', accent: '#86efac', Icon: Leaf },
  { id: 'heart', label: 'Health', keywords: 'health wellbeing care', accent: '#fda4af', Icon: Heart },
  { id: 'coffee', label: 'Break', keywords: 'break rest drink', accent: '#fde68a', Icon: Coffee },
  { id: 'utensils', label: 'Lunch', keywords: 'lunch food meal', accent: '#fdba74', Icon: Utensils },
  { id: 'sun', label: 'Outdoor learning', keywords: 'outside outdoor sun', accent: '#fde68a', Icon: Sun },
  { id: 'pencil', label: 'Writing', keywords: 'writing pencil literacy', accent: '#bae6fd', Icon: Pencil },
  { id: 'microscope', label: 'Investigation', keywords: 'microscope research investigate', accent: '#86efac', Icon: Microscope },
  { id: 'brain', label: 'Thinking', keywords: 'brain thinking focus', accent: '#c4b5fd', Icon: Brain },
  { id: 'shapes', label: 'Geometry', keywords: 'geometry shape maths math', accent: '#bae6fd', Icon: Shapes },
  { id: 'map', label: 'Mapping', keywords: 'map mapping geography', accent: '#fca5a5', Icon: MapIcon },
  { id: 'beaker', label: 'Lab work', keywords: 'beaker lab science', accent: '#67e8f9', Icon: Beaker },
  { id: 'footprints', label: 'Movement', keywords: 'movement walk activity', accent: '#f0abfc', Icon: Footprints },
  { id: 'sparkles', label: 'Special activity', keywords: 'special activity celebration', accent: '#fde68a', Icon: Sparkles },
  { id: 'computer', label: 'Computer', keywords: 'technology tech ict digital computer desktop pc workstation monitor', accent: '#7dd3fc', Icon: Monitor },
  { id: 'laptop', label: 'Laptop', keywords: 'technology tech ict digital laptop notebook portable computer', accent: '#a5b4fc', Icon: Laptop },
  { id: 'tablet', label: 'Tablet', keywords: 'technology tech ict digital tablet ipad touchscreen device', accent: '#f9a8d4', Icon: Tablet },
  { id: 'smartphone', label: 'Smartphone', keywords: 'technology tech ict digital smartphone phone mobile device', accent: '#86efac', Icon: Smartphone },
  { id: 'keyboard', label: 'Keyboard', keywords: 'technology tech ict digital keyboard typing computer', accent: '#fde68a', Icon: Keyboard },
  { id: 'coding', label: 'Coding', keywords: 'technology tech ict digital coding code programming computer software', accent: '#c4b5fd', Icon: CodeXml },
];

const OPTIONS_BY_ID = new Map(OPTIONS.map((option) => [option.id, option]));
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const EMPTY_WIDGETS: { type: string; config: Record<string, unknown> }[] = [];

const activityValues = (activities: unknown): unknown[] => {
  return Array.isArray(activities) ? activities : [];
};

const referencedPictogramIds = (
  widgets: { type: string; config: Record<string, unknown> }[],
  presets: { state: { widgets: { type: string; config: Record<string, unknown> }[] } }[],
): string[] => {
  const ids = new Set<string>();
  for (const widget of [...widgets, ...presets.flatMap((preset) => preset.state.widgets)]) {
    if (widget.type !== 'timetable') continue;
    for (const activity of activityValues(widget.config.activities)) {
      if (!activity || typeof activity !== 'object') continue;
      const imageId = (activity as { imageId?: unknown }).imageId;
      if (typeof imageId === 'string' && imageId) ids.add(imageId);
    }
  }
  return [...ids];
};

export function Pictogram({ icon, imageId, className = '' }: PictogramProps) {
  const [loadedImage, setLoadedImage] = useState<{ id: string; url: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoadedImage(null);
    if (!imageId) return () => { cancelled = true; };

    void getImage(imageId).then((blob) => {
      if (!blob || cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setLoadedImage({ id: imageId, url: objectUrl });
    }).catch(() => {
      if (!cancelled) setLoadedImage({ id: imageId, url: null });
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (imageId && loadedImage?.id === imageId && loadedImage.url) {
    return (
      <img
        src={loadedImage.url}
        alt=""
        aria-hidden="true"
        onError={() => setLoadedImage((current) => current?.id === imageId ? { id: imageId, url: null } : current)}
        className={`object-contain ${className}`}
      />
    );
  }

  const option = OPTIONS_BY_ID.get(icon ?? '') ?? OPTIONS[0];
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <span
        data-pictogram-accent
        className="absolute inset-[18%] rounded-[3px] opacity-75"
        style={{ backgroundColor: option.accent }}
      />
      <option.Icon className="relative z-10 h-full w-full text-slate-950" strokeWidth={2.15} />
    </span>
  );
}

type PictogramPickerProps = {
  icon?: string;
  imageId?: string;
  size?: 'compact' | 'display';
  onChange: (value: { icon?: string; imageId?: string }) => void;
};

type PickerPosition = { left: number; top: number };

export function PictogramPicker({ icon, imageId, size = 'compact', onChange }: PictogramPickerProps) {
  const currentWidgets = useAppStore((state) => state.current.widgets);
  const presets = useAppStore((state) => state.presets);
  const uploadedIds = useMemo(
    () => referencedPictogramIds(currentWidgets ?? EMPTY_WIDGETS, presets),
    [currentWidgets, presets],
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chooserRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<PickerPosition | null>(null);
  const [activeTab, setActiveTab] = useState<'default' | 'uploads'>('default');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const displaySize = size === 'display';

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(352, window.innerWidth - 24);
    const estimatedHeight = Math.min(420, window.innerHeight - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const below = rect.bottom + 8;
    const top = below + estimatedHeight <= window.innerHeight - 12
      ? below
      : Math.max(12, rect.top - estimatedHeight - 8);
    setPosition({ left, top });
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !chooserRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    const reposition = () => updatePosition();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  const showPicker = () => {
    updatePosition();
    const panel = rootRef.current?.closest('[role="dialog"][data-shortcuts-scope="local"]');
    setPortalTarget(panel instanceof HTMLElement ? panel : document.body);
    setError('');
    setOpen(true);
  };

  const chooseIcon = (id: string) => {
    onChange({ icon: id, imageId: undefined });
    setOpen(false);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Choose an image under 20 MB.');
      return;
    }

    setUploading(true);
    try {
      const resized = await resizeImage(file, 512);
      const id = await putImage(resized);
      if (!mountedRef.current) return;
      onChangeRef.current({ icon: undefined, imageId: id });
      setOpen(false);
    } catch {
      if (mountedRef.current) setError('This image could not be read. Try another image.');
    } finally {
      if (mountedRef.current) setUploading(false);
    }
  };

  const visibleOptions = OPTIONS.filter((option) =>
    `${option.label} ${option.keywords} ${option.id}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  return (
    <>
      <div ref={rootRef} className="inline-flex align-top">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => open ? setOpen(false) : showPicker()}
          aria-label={icon || imageId ? 'Change pictogram' : 'Add pictogram'}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={icon || imageId ? 'Change pictogram' : 'Add pictogram'}
          className={`flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${displaySize ? 'h-11 w-11' : 'h-9 w-9'}`}
        >
          {icon || imageId ? (
            <Pictogram icon={icon} imageId={imageId} className={displaySize ? 'h-[34px] w-[34px]' : 'h-5 w-5'} />
          ) : (
            <SquarePlus className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {open && position && portalTarget && createPortal(
        <section
          ref={chooserRef}
          role="dialog"
          aria-label="Choose a timetable pictogram"
          data-escape-boundary="nested-dialog"
          className="fixed z-[410] flex max-h-[min(26rem,calc(100dvh-24px))] w-[min(22rem,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-xl"
          style={{ left: position.left, top: position.top }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
            <h2 className="font-semibold text-slate-800">Choose a pictogram</h2>
            <button
              type="button"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
              aria-label="Close pictogram chooser"
              title="Close pictogram chooser"
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex shrink-0 gap-1 border-b border-slate-200 px-3 py-2" role="tablist" aria-label="Pictogram collections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'default'}
              onClick={() => setActiveTab('default')}
              className={`rounded px-3 py-1.5 text-xs font-medium ${activeTab === 'default' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Default
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'uploads'}
              onClick={() => setActiveTab('uploads')}
              className={`rounded px-3 py-1.5 text-xs font-medium ${activeTab === 'uploads' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              My uploads
            </button>
          </div>

          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3" role="tabpanel">
            <label className="sr-only" htmlFor={searchId}>Search pictograms</label>
            <div className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-300 px-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={activeTab === 'default' ? 'Search subjects and activities' : 'Search uploads'}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {activeTab === 'default' ? (
              <div className="grid grid-cols-4 gap-2">
                {visibleOptions.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseIcon(id)}
                    aria-label={`Use ${label} pictogram`}
                    aria-pressed={icon === id && !imageId}
                    title={label}
                    className={`flex h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-md border p-1.5 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${icon === id && !imageId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                  >
                    <Pictogram icon={id} className="h-10 w-10 shrink-0" />
                    <span className="w-full truncate text-center text-[10px] leading-tight">{label}</span>
                  </button>
                ))}
                {!visibleOptions.length && <p className="col-span-4 py-4 text-center text-xs text-slate-500">No pictograms match this search.</p>}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedIds.filter((_, index) =>
                    `uploaded pictogram ${index + 1}`.includes(query.trim().toLocaleLowerCase()),
                  ).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { onChange({ icon: undefined, imageId: id }); setOpen(false); }}
                      aria-label={`Use uploaded pictogram ${uploadedIds.indexOf(id) + 1}`}
                      aria-pressed={imageId === id}
                      className={`flex aspect-square min-w-0 items-center justify-center rounded-md border p-2 hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${imageId === id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                    >
                      <Pictogram imageId={id} className="h-full w-full" />
                    </button>
                  ))}
                </div>
                {uploadedIds.length === 0 && <p className="py-2 text-xs text-slate-500">Uploaded timetable pictograms will appear here.</p>}
                {uploadedIds.length > 0 && !uploadedIds.some((_, index) =>
                  `uploaded pictogram ${index + 1}`.includes(query.trim().toLocaleLowerCase()),
                ) && <p className="py-2 text-xs text-slate-500">No uploads match this search.</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void onFile(event)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex min-h-9 items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-wait disabled:opacity-60"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {uploading ? 'Adding image…' : 'Upload image'}
                </button>
              </>
            )}

            {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
            {(icon || imageId) && (
              <button
                type="button"
                onClick={() => { onChange({ icon: undefined, imageId: undefined }); setOpen(false); }}
                className="border-t border-slate-200 pt-2 text-left text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                Remove pictogram
              </button>
            )}
          </div>
        </section>
        , portalTarget,
      )}
    </>
  );
}
