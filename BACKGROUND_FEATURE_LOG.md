# Local Background Gallery Log

## Release Approval (2026-09-23)

- User accepted the gallery and explicitly approved pushing all accumulated changes. This supersedes the pending/local-only statuses recorded below.
- Combined pre-commit checks: 98 tests passed; TypeScript and production build passed.

Scope: local-only background gallery. No cloud APIs, new dependencies, commits, or pushes. Supplied photo binaries were not modified.

## Baseline

- The Background tool used a left-anchored popover; parent measurement at 909x854 found it partly off the left edge and upload labels cropped. Existing screen background was Solid `#dbeafe`; Timer was `05:00` and the Clock was present.
- The single upload path replaced and deleted the previous image. Existing image storage is IndexedDB; screen/preset and Image widget references are persisted separately.
- Parent validated all twelve supplied JPEGs: six 2560x1440 originals and six 480x270 thumbnails. Local JPEG byte total is 4,662,674. This is 110,000 bytes below the reported 4,772,674 total; the measured total covers every `*.jpg` in `public/backgrounds`.

## Change Ledger

1. Replaced the Background popover with the shared right-side settings panel. The panel is constrained to 520px wide or the viewport width minus 24px, with a fixed close header and viewport-bounded scrolling. Existing Background toolbar entry remains the only entry point.
2. Added My uploads with multiple image selection, 20MB per-file validation, image resizing, local names/tags, IndexedDB persistence, thumbnail selection marks, fit controls, and recoverable loading/upload/deletion feedback. The first valid image in a multi-upload batch becomes the background, preserving the former single-upload behavior.
3. Added legacy active-background adoption without scanning IndexedDB, avoiding accidental collection of Image widget uploads. Missing legacy blobs remain visible as unavailable gallery entries.
4. Added six bundled Pexels photos grouped as Nature, Autumn, and Coast. Curated state stores stable asset IDs, resolved through `import.meta.env.BASE_URL`; preset export/import preserves those IDs without embedding duplicate image files. Per-photo photographer/source links are visible. `public/backgrounds/CREDITS.md` records sources, license, download date, and image dimensions. The compact UI footer links the Pexels license and external Pexels/Pixabay browsing.
5. Extended the shared panel with optional title-icon and width props. Extended the optional persisted gallery metadata field/default while retaining compatibility with older saved state.
6. Updated cleanup to preserve saved gallery images. Removing a saved upload clears its active background before checking references, preserves blobs referenced by screens/presets/widgets, and deletes unreferenced blobs before metadata so a storage failure leaves the gallery item intact. Background rendering no longer shows stale URLs after a switch or a missing asset.
7. Added tests for local search, upload tags and multi-upload/validation, legacy adoption and active removal, IndexedDB retention/deletion failures, cleanup, stale image rendering, catalogue paths/credits, store metadata, and preset round-tripping.

## Review Adjustments

- The first review requested fixes for immediate re-adoption after deleting the current image, object URLs created after gallery effect cancellation, repeated license paragraphs, three-column curated previews, and status feedback placed at the bottom. These were corrected; the final gallery uses two curated columns, a single compact footer, and status feedback beside My uploads.
- Follow-up review required deletion to await binary removal before metadata removal. This was corrected and covered by a storage-failure test.
- Final visual requests moved the uploaded-image checkmark away from the delete control and removed the repeated “not copyright-free” sentence. UI edits are now frozen for the parent’s final mobile/deletion/fit checks.
- A malformed initial TypeScript catalogue assertion was caught before the UI handoff, corrected, and followed by a passing build. No rejected layout was repeated.

## Measurements and Verification

- Responsive panel constraints: right/top inset 12px; width `min(520px, viewport - 24px)`; maximum height `100dvh - 24px`. Parent’s baseline viewport was 909x854. Final computed browser dimensions are pending parent review.
- Full automated suite: 21 files, 91 tests passed. Existing Vite esbuild/oxc deprecation warnings remain.
- Production build: TypeScript and Vite passed; 1,890 modules transformed; Vite completed in 3.90s.
- `git diff --check`: passed. Git emitted only existing working-copy LF/CRLF normalization warnings.
- Parent’s early browser checks passed: curated HD photo selection, Auckland search filtering, multi-JPEG upload, uploaded-image selection/render, and persistence across reload. Parent’s final mobile, deletion/reference, and fit checks remain pending.
- Final parent browser review: Cover/Contain selection changes worked; Alpine lake rendered across the canvas; X closed the panel and returned focus to Background; Escape also closed it. A 390x844 viewport override showed two-column photos and an accessible close header, but the browser capture was scaled, so exact mobile pixel dimensions are not claimed. The override was reset. DOM dimension evaluation timed out in the browser tool; desktop visual inspection used the 909x854 screenshot instead.
- Deletion/reference behavior is verified by automated tests, not an additional final manual deletion pass. Two landscape test uploads remain in My uploads. No personal uploads were removed.
- Reviewer acceptance: Accepted for local user review, with the measurement limitation above. User acceptance: Pending. No refused approach was reapplied.
- No commit or push was made.
