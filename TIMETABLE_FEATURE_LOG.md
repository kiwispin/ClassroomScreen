# Timetable Feature Log

Date: 2026-09-23

## Reference research

Reviewed the public Classroomscreen Timetable description and parent-observed reference behavior. The widget supports List, Checklist, and Timed schedule modes; editable title, activities, pictograms, breaks, durations and ordering; 12/24-hour time display; and activity-end alarm or silence. The implementation uses the observed behavior as product guidance and is independently written.

Reference: [Classroomscreen Timetable](https://classroomscreen.com/widgets/timetable)

## Implementation

- Registered Timetable as a secondary widget under More, with a 440 x 420 default size and a default timed schedule starting at 08:00.
- Added List, Checklist, and Timed schedule modes. Mode changes preserve the shared ordered activity/break data and checklist completion state; List and Checklist hide break rows and schedule times.
- Timed schedules use wall-clock ranges, sequential durations, hidden break gaps, per-activity progress/completion display, 12/24-hour formatting, and selectable existing sound effects or silence. No elapsed-time/manual-start timer is used.
- Added activity and independently ordered break editing, native drag handles, compact up/down controls, manual minute entry with +/-5-minute controls, title settings, and activity pictogram selection.
- Integrated shared pictogram/upload persistence and preset/background reference handling with the accompanying shared changes. Core code clears the alternate icon/image reference when a pictogram is changed; it does not delete uploaded blobs.
- Added deterministic before-start/overnight timing behavior, schedule validation, and alarm boundary handling that does not emit an alarm on mount or after a schedule edit.
- Fixed title's one-pixel content overflow with bottom padding, enabled moving an activity above a leading break, and made manual duration entry reflect the accepted capped value even if the stored value did not change.

## Verification

- Focused Timetable and registry tests: 5 files, 34 tests passed.
- Full repository test suite after asset integration: 29 files, 140 tests passed.
- TypeScript project build: passed.
- Production Vite build: passed (1,896 modules transformed).
- Existing Vite/esbuild deprecation warnings were reported by Vitest; they did not fail tests or the production build.

## Parent browser checks

Behavior checks reported during the parent browser pass:

- Timetable is available under More; Checklist completion works, and List hides breaks and time ranges.
- Switching back to Timed preserves activity and break durations and the expected sequential ranges.
- Start time 22:01 and 24-hour formatting persist after reload.
- The searchable pictogram chooser works; Escape closes its child chooser without closing the settings panel.
- The settings panel fits a 390 x 844 viewport with its close control visible.
- Reordering a break down moves Maths from 22:31 to 22:21, and moving it back restores the original range.
- Reading and Maths pictograms persisted after reload. A bundled image uploaded through My uploads also persisted after reload and rendered at natural dimensions 480 x 270; the image was then replaced with the Mathematics icon.
- Active Reading progress rendering looked correct. After the final padding change, the title's client height and scroll height both measured 21px; the scrollbar is gone in the screenshot.
- The default 440 x 420 widget has some whitespace with only two rows; parent considers this acceptable because the widget can be resized.

The UI is stable and the final title fix is visually verified.

## Review and delivery

Parent technical review is **ACCEPTED**, including code/browser tests and the final title check. User acceptance is **PENDING**. Changes remain local; no commit or push was made.

## Approaches not adopted

- No fixed five-minute minimum or step-only duration editing: durations allow direct whole-minute entry from 1 minute, with +/-5-minute controls as a convenience.
- No activity-plus-break groups: breaks remain independent timed rows, so they can be reordered or removed without implicitly moving/deleting an activity.
- No nearest-day schedule heuristic: ordinary schedules before today's start remain upcoming; only a schedule that crosses midnight is continued from the previous day when the current time is before its start.
- No non-portal pictogram chooser: the chooser uses the existing portal behavior so nested Escape handling and viewport placement work correctly.
- No speculative object-shaped activity/config compatibility layer: persisted activities use the agreed flat item shape.
- No proprietary pictogram copying: the built-in set uses 24 Lucide icons, alongside user-uploaded images.

## Technology pictogram refinement

- Expanded the default set from 24 to 30 with Computer, Laptop, Tablet, Smartphone, Keyboard, and Coding choices. Their stable IDs are `computer`, `laptop`, `tablet`, `smartphone`, `keyboard`, and `coding`; existing pictogram IDs and uploaded-image handling are unchanged. Search terms include technology, ICT, digital, and relevant device/programming terms.
- Kept the toolbar treatment restrained: Lucide outlines use a dark stroke with a soft per-icon accent tile inset 18% (64% of the icon's width and height) at 75% opacity. The chooser and selected activity/settings trigger share the same renderer. The Computer choice uses Lucide Monitor for a clearer desktop display. The picker trigger retains its white backing for contrast on the active row; uploaded images have no added tint or tile.
- Visual review rejected the first corner-only accent as too small at 20–24px. The larger rounded inset tile replaces it; no decorative orb or new icon framework was added.

## Refinement verification

- Focused pictogram, image cleanup, and preset import/export tests: 3 files, 25 tests passed.
- TypeScript project build: passed.
- Production Vite build: passed; 1,896 modules transformed in 4.05s. Output measured 50.00 kB CSS (8.94 kB gzip) and 426.08 kB JavaScript (122.94 kB gzip).
- Parent browser measurement: an ICT search returned all 6 new technology choices. After selecting Tablet and reloading, Tablet remained selected (`aria-pressed=true`). Reading will be restored after the final screenshot.
- Parent final technology screenshot: **ACCEPTED**. Accent color is clearly visible at pictogram size, and the Monitor icon reads as a desktop computer. Parent technical visual acceptance is **ACCEPTED**; user acceptance remains **PENDING**. Changes remain local; no commit or push was made.

## Larger pictogram sizing

> **Superseded and USER REFUSED:** the 56 px art / 64 px control and 20/14/22 px typography recorded in this historical section are not the approved design. The earlier parent screenshot acceptance does not apply to the corrected scale below.

- Parent DOM measurement of the official Timetable demo: the timetable pictogram is 58 CSS px wide (61.5 px high in Timed rows and 58 px high in Checklist rows), rendering at about 33 px after the demo canvas scale of 0.569. Before this pass, our pictogram art was 20 px in a 36 px trigger, with 24 px chooser art.
- Proposed and implemented: a scoped `display` picker variant keeps Settings compact by default, and gives both Timed and List/Checklist rows 56 px pictogram art in a stable 64 x 64 px trigger. Timed rows are at least 80 px tall; List/Checklist rows are at least 76 px. Chooser previews are 40 px in 80 px tiles. Uploaded images use the same 56 px `object-contain` box.
- To preserve that art size, Timetable alone now has a 280 px canvas resize minimum; other widgets retain 120 px. At 280 px, after the widget and row horizontal insets, the row has 236 px for contents. An ended row reserves 64 px for the pictogram, two 8 px gaps, and 28 px for its end marker, leaving a 128 px text column. Time labels wrap when needed rather than shrinking the pictogram.
- Verification: focused Pictograms, Timetable display, and WidgetCanvas tests passed (3 files, 17 tests); TypeScript project build passed; production Vite build passed (1,896 modules transformed; 49.99 kB CSS / 8.94 kB gzip and 426.21 kB JavaScript / 123.01 kB gzip). The 280 px test confirms the display-size classes, row minimum, and wrapping time label; the canvas test confirms the Timetable-only resize floor.
- Parent screenshot verification: rendered pictogram art measured 56 px in 64 px controls; Settings remained 20 px in 36 px controls; chooser previews measured 40 px. Timed, List, and Checklist screenshots passed. At the 280 px minimum, Checklist fit; a 12-hour Timed row with an ended marker fit its `10:01 PM – 10:21 PM` range without overlap. The parent restored the 440 px, 24-hour Timed view afterward.
- Larger-size visual result: parent technical review is **ACCEPTED**. User acceptance remains **PENDING**. No commit or push was made.

## Timetable typography rebalance

- Applied the approved fixed type sizes in the widget display only: activity names 14 px to 20 px, timed ranges 12 px to 14 px, and the title 16 px to 22 px. Settings typography is unchanged; no viewport-based scaling was introduced.
- Activity names wrap with explicit 1.15/1.2 line-height, and time ranges wrap at 1.2 line-height beside the 56 px pictograms. The 22 px title keeps its 64 px cap, one-pixel bottom padding, and hidden overflow (no scrolling title scrollbar).
- Regression coverage passed for Timed, List, and Checklist at 280 px and 440 px: requested type classes are present and the title has no scrollable overflow. Focused tests: 3 files, 18 passed. TypeScript project build passed. Production Vite build passed (1,896 modules transformed; 50.15 kB CSS / 8.97 kB gzip and 426.24 kB JavaScript / 123.02 kB gzip).
- Parent screenshot review at 280 px and 440 px, in Timed and Checklist modes: **ACCEPTED**. The parent measured the title at 22 px and activity names at 20 px. At 280 px, “Independent reading and reflection” wrapped to three lines and the 12-hour time range to two without overlap; Checklist row clientWidth and scrollWidth both measured 256 px. The parent restored Reading, 24-hour Timed mode, and 440 px afterward. User acceptance is **PENDING**. No commit or push was made.

## Corrected display scale

- The 58 px official-demo DOM image measurement is unscaled; at the demo canvas scale of 0.569, the rendered pictogram art is about 33 px. This replaces the earlier raw-CSS comparison as the visual target.
- Applied the corrected widget-display sizes: 34 px art in 44 px controls; activity names 16 px; timed ranges 12 px; title 18 px. Timed rows have a 60 px minimum and List/Checklist rows 56 px. Settings remain 20 px art in 36 px controls; chooser previews remain 40 px. The 280 px Timetable canvas minimum is unchanged. No functional or responsive-font changes were made.
- Title overflow remains hidden within its existing 64 px cap with bottom padding, so it does not show a scrollbar. Text retains wrapping and explicit line-height.
- Verification: full suite passed (30 files, 145 tests); TypeScript project build passed; production Vite build passed (1,896 modules transformed; 50.14 kB CSS / 8.97 kB gzip and 426.24 kB JavaScript / 123.02 kB gzip).
- Parent DOM and screenshots at 280 px and 440 px confirmed 34 px art, 44 px controls, 16 px names, and 18 px title. At 280 px, the narrow row measured 256 px clientWidth and scrollWidth; the ended row was 60 px and the active row with progress was 64 px, with no overlap. The parent restored 440 px afterward. Technical verification is **ACCEPTED**; visual user acceptance is **PENDING**. No commit or push was made.

## Release approval

- User requested "Push, thanks." after reviewing the corrected display scale. Current Timetable implementation and corrected sizing: **USER ACCEPTED** for publication. This supersedes pending acceptance entries for the delivered version, not the historical oversized approach marked refused.
- Release baseline: 30 test files / 145 tests passed, TypeScript and production build passed. GitHub deployment will run its own test and build checks.
