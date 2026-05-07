# ClassroomScreen

Personal classroom dashboard — free-form draggable widgets, custom backgrounds, themed tiles, multiple saved presets, scheduled auto-load, optional sound effects. Hosted as a static site on GitHub Pages.

**Live:** https://kiwispin.github.io/ClassroomScreen/

## What's in it

### Widgets
- ⏰ Clock — digital, 12 / 24h, optional seconds + date line
- 📝 Notepad — auto-fitting text size with manual override
- ⏱️ Timer — three responsive layouts (square / medium / wide), per-digit ± controls, custom MP3/OGG sound on finish, depleting progress ring
- ⏲️ Stopwatch — count-up with HH:MM:SS auto-promotion past one hour
- 🔀 Name picker — paste a list, slot-machine reveal, optional "remove after pick"
- 🎯 Dice — 1-8 dice or custom number range, animated roll
- 🚦 Traffic light — three signals on a dark housing
- 💬 Work symbols — silent / whisper / partner / group / hands up / no talking; tap once for "spotlight" mode
- 📅 Calendar — day-of-week + date, optional month grid with today highlighted
- More overflow: 🖼️ image, 📱 QR code, 🎬 video (YouTube), 📊 poll, 🔊 noise meter (mic-driven EQ)

### Around the widgets
- **Backgrounds** — solid colour, gradient, or uploaded image (resized + stored in IndexedDB)
- **Themes** — 16 colour themes per widget; tile bg, text, and accent (`--w-accent`) all flow through to widget controls (timer ring, play buttons, etc.)
- **Presets** — save the current screen as a named preset, switch with one click, rename, delete
- **Schedule** — auto-load presets at chosen times of day on chosen days of the week (e.g., Mon-Fri 09:00 → "Maths")
- **Export / Import presets** — JSON file with embedded images and audio for moving between machines
- **Annotate overlay** — full-screen pen / eraser / undo / clear over the whole screen
- **Floating widget chrome** — trash + theme + settings appear above each tile on hover
- **Auto-hiding toolbar** — bottom toolbar slides away after 4s idle; pin to keep visible
- **Keyboard shortcuts** — `A` annotate · `F` fullscreen · `?` help · `Esc` close

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (state, with `persist` to localStorage)
- IndexedDB via `idb-keyval` for binary blobs (images + audio)
- `react-rnd` for drag/resize
- `lucide-react` for icons
- `qrcode.react` for QR generation
- Web Audio API for synthesized SFX
- Vitest + Testing Library + `fake-indexeddb` for tests

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173/`).

Other scripts:

```bash
npm test           # run unit tests once
npm run test:watch # watch mode
npm run build      # production build
npm run preview    # serve the production build at /ClassroomScreen/
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.

If you fork this and host under a different repo name, edit `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/<your-repo-name>/',
});
```

## Project layout

```
src/
  app/             # App shell
  store/           # Zustand store + types
  widgets/<Name>/  # Each widget: index.tsx (body), meta.ts, optional Settings.tsx + logic.ts
  overlays/        # Background layer, Annotate canvas
  components/      # Toolbar, WidgetChrome, ThemePicker, ScheduleEditor, dialogs, …
  lib/             # audio, audio-storage, scheduler, preset-io, themes, useFullscreen, useGlobalShortcuts
docs/superpowers/  # design specs + implementation plans
```

## Adding a widget

1. Create `src/widgets/<Name>/`.
2. Add `index.tsx` exporting a default React component receiving `{ instance: WidgetInstance }`.
3. Add `meta.ts` exporting a `WidgetMeta` (icon, label, defaultSize, defaultConfig, optional `Settings`, `iconColor`, `secondary`).
4. Register in `src/widgets/registry.ts`.
5. Add the type literal to `WidgetType` in `src/store/types.ts`.

The widget body inherits theme bg/text from its parent tile and can read `var(--w-accent)` for primary controls.

## Known oddities

- Widget metadata is stored in `localStorage`; uploaded images and timer sounds live in IndexedDB. Different browsers / profiles get different stores.
- Custom timer audio files use a separate IDB database (`classroomscreen-audio`) because `idb-keyval` only manages one object store per database.
- The QR code is rendered in fixed black-on-white inside a small white card so phone cameras still scan reliably regardless of the widget's theme.

## Troubleshooting

**`npm install` fails with `EACCES` / `Invalid response body` errors** — your `~/.npmrc` may have a stale `cache=` line pointing somewhere unwritable, or `~/.npm/_cacache` may have files owned by root from a past `sudo npm install`. The included project-level `.npmrc` redirects the cache to `./.npm-cache` to sidestep both.

**Microphone won't start in the Noise meter** — check the browser site permissions. Some browsers also block autoplay until you've interacted with the page, which can swallow the timer's finish sound on the very first run.

## License

Personal project, no formal license. The codebase is open if you want to learn from it; ClassroomScreen® and its illustrated icons are the property of the original team and are *not* reproduced here — the icons in this app come from the MIT-licensed [Lucide](https://lucide.dev) set.
