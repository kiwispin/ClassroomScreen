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
