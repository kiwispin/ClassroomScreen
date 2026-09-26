# Classroomscreen comparison

User preference: compare new work with official Classroomscreen for both appearance and behaviour. Before each feature, inspect the relevant current official interface or documentation. After implementation, compare spacing, readable sizes, interaction steps, keyboard use, persistence, and narrow-screen behaviour. Record limitations rather than claiming parity without evidence.

## Saved screens, 26 September 2026

Reference: https://classroomscreen.com/helpcenter/your-classroomscreen-dashboard and the public app at https://classroomscreen.com/app.

The official guide describes visual screen decks, duplication, ordering, and in-lesson navigation. The public app was opened and its preview-card welcome interface visually inspected at a desktop size. Its saved-deck workflow requires capabilities not available in the anonymous session; a complete live comparison of that workflow was not performed.

Implemented locally:

- Saved-screen cards with static background/layout previews, search, active state, rename, duplicate, and earlier/later ordering.
- Previous/next navigation with boundaries and a save/discard/cancel choice for edited screens.
- Labelled schedule controls, distinct weekday labels, conflict/no-day warnings, and cleanup of rules when a preset is deleted.
- Shared responsive dialogs, keyboard focus containment, Escape dismissal, and focus restoration, including nested dialogs.

The preview is deliberately a simplified layout, not a screenshot: opening the browser does not start timers, request microphone access, play media, or run other live widgets. Existing explicit preset saving remains; this does not add cloud autosave, folders, or full screen decks. Reordering uses accessible buttons rather than drag and drop.

Validation: 176 tests passed, TypeScript and production build passed. Browser review covered saving, duplication, reordering and the schedule editor, including its 390 x 844 layout. Two review presets and an inactive schedule rule were created in the isolated local preview browser for inspection.

## Widget arrangement, 26 September 2026

Reference: https://classroomscreen.com/helpcenter/setting-up-your-screen and the public app. Inspected the official selected Clock and its More menu in the live app: copy, lock in position, spotlight, pinning and layering appear there. The guide documents multi-widget alignment and undo/redo shortcuts.

Implemented lock/unlock and duplication under each widget's More actions, a drag handle, selection with Shift-click or an accessible checkbox list, six alignment commands, optional 16-pixel snapping, and undo/redo controls and shortcuts. Locked widgets reject movement, resize and deletion while their controls still work. Layout undo preserves later content/settings edits. Duplicated timers and stopwatches start stopped. Shared uploaded assets are retained for copies and layout history.

Browser checks covered lock/delete protection, duplication, alignment, snapping during drag, resize and single-step undo, and restoring a deleted widget. The full suite passed 186 tests; TypeScript and production build passed. The official workflow uses a compact contextual menu; ours uses the existing shared panel and a separate Arrange control. Grouping, cross-screen clipboard, pinning and layering are not added by this increment. Layout history is limited to 50 entries, is not persisted, and clears when switching screens; lock flags and the snap preference persist. Snapping uses grid steps rather than smart alignment guides.

## Widget toolbar, 26 September 2026

Inspected the official live app's More menu and Edit widget bar dialog. The official interface uses a compact icon popover and drag ordering; its setting-up-your-screen guide describes active-widget dots.

Added browser-persisted favourites and ordering, restore defaults, active-instance dots/counts, and a searchable library grouped by purpose. More stays fixed beside the horizontally scrolling favourites. Reordering uses labelled earlier/later buttons for keyboard and touch access. The library uses the shared responsive dialog rather than reproducing the official compact popover. Music is directly available in the scrolling toolbar. Hiding the bar removes its controls from keyboard navigation and leaves a visible Show widget bar button.

Verified desktop (1280 x 720) and narrow (390 x 844) layouts, search, keyboard dismissal, hide/show, and favourite ordering across reload. Restored default favourites after review. All 191 tests passed with two workers; the initial unrestricted run had one background-picker timeout. TypeScript, production build and whitespace checks passed. This increment does not add drag ordering or claim full feature parity with the official app.

## Timer and stopwatch controls, 26 September 2026

Compared the live official timer's ring, digits, per-digit adjustments and play/reset controls. Its timer documentation (https://preview.classroomscreen.com/widgets/timer) describes three size-dependent layouts. This pass preserves our existing adaptive timer layouts rather than claiming complete parity; the official stopwatch was not inspected live.

Fixed pause precision in both widgets to use the actual click time, refreshed the display clock on resume, kept the timer's last second visible until expiration, and based paused adjustments on the displayed remaining duration. Added distinct keyboard-accessible digit adjustments, visible focus outlines, reduced-motion-aware flashing and clearer reset-arrow icons. Stopwatch hour values use smaller type to fit the extra digits.

Validation: 195 tests passed, including new exact pause/resume, paused adjustment, single finish-alert and stopwatch reset checks. TypeScript and production build passed. Browser checks covered the desktop timer/stopwatch, keyboard start/pause and entering/exiting fullscreen. Sound invocation was tested automatically; audible output was not verified. Changes remain local pending publication.

## Dice overhaul, 26 September 2026

Inspected the official live Dice widget and its settings catalogue, including selecting its arithmetic-symbol die. The reference offers one/two/three dice, positive and negative number dice, arithmetic symbols, colours, D12/D20, coin, letters, rock-paper-scissors, custom bounds, sound and themes. Our earlier catalogue lacked the arithmetic mode, used a misleading +x preview, and had uneven face styling and sizing.

Rebuilt the local rolling view with consistently outlined faces, proper number/symbol tiles, vector hand illustrations, triangular three-dice arrangement and an adaptive grid up to eight dice. The catalogue now follows the reference's three-column arrangement and includes the missing arithmetic mode. Added six dice palettes, optional totals, polyhedral sets, an optional synthesized rattle, result announcements, and reduced-motion handling. Existing coin, colour, letter and custom-number modes remain. Configuration changes cancel a pending roll, and counts/bounds are normalized. Coin remains silver; coloured polyhedral dice use a tinted central face. Sound is off by default to preserve previous silent behaviour.

Validation: 199 tests passed, TypeScript and production build passed. Browser review covered the 390-pixel catalogue, arithmetic selection, three/eight-dice layouts, colour and total options, and rolling. Sound invocation is covered automatically; audible output was not independently verified. Artwork is locally implemented SVG, not copied site assets. This is a local change pending publication, not a claim of exact visual or feature parity.

### Polyhedral geometry correction

Using the user's attached close-up references, replaced the incorrect subdivided D12/D20 artwork. D12 now has a pentagonal front and five surrounding pentagonal faces; D20 uses a triangular front with triangular adjacent faces. Removed blue wireframe outlines, adjusted the silhouette and grey face shading, and reduced numeral weight/size. Shared artwork updates both catalogue and rolled results. Visually inspected the catalogue and selected D20 in the browser; TypeScript and production build passed.

### Compact More popup

Replaced the large categorized/search dialog with a 320-pixel, four-column popup anchored above More, following the official popup inspected earlier. It shows non-favourite widgets and an Edit widget bar header; favourites are edited in their separate dialog. Popup is viewport-clamped, scrolls if necessary, closes on outside click/Escape/selection and restores keyboard focus appropriately. Checked at desktop and 390-pixel widths. Six toolbar behaviour tests, TypeScript and production build passed.

### Stopwatch content sizing and placement

Changed the stopwatch to a full-width, lighter time display with smaller hundredths and bottom-corner controls, using the user's reference image. Hour values still reduce their size to fit. New widgets now search for nearby free space, reserving toolbar space and avoiding identical placement on crowded screens. Browser review confirmed separate stopwatch positions and the new stopwatch layout.
