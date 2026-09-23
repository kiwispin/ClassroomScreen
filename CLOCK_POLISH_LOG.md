# Clock Glass and Layout Polish Log

## Release Approval

- User accepted the local work and explicitly requested "Push live" on 2026-09-23. This supersedes pending and local-only statuses below.
- Pre-release verification: 25 test files / 106 tests passed in 7.96s; TypeScript and production build passed. Remote main matched local HEAD before committing.

Date: 2026-09-23

Scope: Add the approved optional frosted-glass appearance to Clock and correct digital/analog Clock fitting at small widget sizes. The existing Clock settings panel and modes remain in place. Timer behavior stays opaque by default and otherwise unchanged; no other widget, preset schema, dependency, commit, or push was added.

## Baseline

- Read `SETTINGS_POLISH_LOG.md` and `TIMER_GLASS_LOG.md`. Kept the accepted `SettingsToggle`, background-only alpha plus 12px blur, 20–100% slider in 5% steps, and opaque default. Avoided the previously refused native checkbox and ten-tile Timer sound approaches.
- Parent browser baseline at 909x854: Clock at (80, 320), 280x140, in 12-hour seconds mode rendered `09:42:20 PM` in a 256x102.396px box at 51.2px font; `PM` wrapped to a second line. The date fit at 127.07x16.5px with 11px font. Analog face was 92.79px square with an unusually small date.

## Changes

1. Added `src/lib/widget-glass.ts` with shared opacity bounds/default, normalization, and hex-alpha conversion. `ThemePicker` and `WidgetTile` use it directly instead of importing the Timer module; Timer retains its existing exported constant names.
2. Routed the existing Color theme popover glass controls to Clock and Timer only. Clock stores the same optional `frostedGlass` and `glassOpacity` config fields; missing/false remains opaque and enabled opacity defaults to 75%. Rendering applies alpha and blur to the tile background only, not its content. Other widgets ignore those fields.
3. Sized digital time from the formatted string, keeping the 12-hour suffix on the same line and slightly smaller than the time. Kept the existing large 24-hour/no-seconds appearance. Reduced digital padding to 8px. Analog uses small fixed outer spacing, reserves a responsive date row when shown, and lets the face grow when hidden; dates can wrap and retain an 8px minimum.
4. Added Clock layout, widget-chrome routing, and Clock/Timer glass checks. Extended preset tests to verify Clock glass options round-trip and legacy Timer/Clock configs remain unchanged. Preset format/version was not changed.

## Browser Review

- Parent review at the default 280x140 Clock: root padding 8px; 12-hour seconds stayed on one line at 183.65x39.33px with 39.336px font.
- At the 120x80 minimum widget size, digital scroll dimensions remained 120x80 and time measured 72.34x15.5px. Analog with date also remained 120x80 with a 48.96px square face and no overflow.
- At 20% Clock glass, computed background was `rgba(255, 255, 255, 0.2)`, backdrop filter `blur(12px)`, and tile opacity 1. Timer remained at its existing Midnight 60% appearance.
- Parent toggled Clock glass to 75%, reloaded, and verified it persisted. Turning it off restored the opaque white background, no blur, and opacity 1.
- Parent also checked the analog face in Midnight, verified switching between 12- and 24-hour time, and left the preview as a Midnight Clock at 75% glass in 12-hour seconds mode below Timer.
- At 390x844, the settings popover measured 366x393.33px at (12, 12) and fit. Escape closed it with zero dialogs left and focus returned to Clock settings. Screenshot was checked; viewport was reset afterward.

## Rejected Attempt

- Initial root padding/gap used `min(4cqi, 4cqb)` on the element that establishes the Clock query container. Those units resolve against an ancestor/viewport there; at 909x854 the resulting padding was 34.16px. Reviewer rejected that sizing. Replaced it with fixed `p-2` digital spacing (8px) and `p-1` analog spacing (4px); keep container-query sizing on descendants only.

## Verification

- Focused tests: 5 files / 21 tests passed.
- Full suite: 25 files / 106 tests passed using `C:\Users\master\Documents\Classroom Screen\.tools\Node\node.exe`.
- TypeScript build passed with the same explicit x64 Node runtime.
- Production build passed: 1,891 modules transformed; Vite completed in 3.98s.
- `git diff --check` passed. Existing Vite esbuild/oxc deprecation warnings remain. No dependencies or lockfiles changed.

## Acceptance

- Reviewer: Accepted after parent browser review and final code/test/build checks.
- User: Pending final review.
- No commit or push was made.

## Execution

Implementation and tests were completed by the spawned `gpt-6-luna` agent at xhigh reasoning. Parent independently reviewed the code and supplied the browser measurements above.
