# Clock and Timer Settings Polish Log

## Release Approval (2026-09-23)

- User accepted the accumulated local changes and explicitly requested a GitHub push. This supersedes the pending/local-only statuses recorded below.
- Pre-commit verification: 23 test files / 98 tests passed in 7.32s; TypeScript passed; production build passed in 4.11s (1,890 modules). Remote main matched local HEAD before committing.

Scope: local-only Clock and Timer settings panel polish. No dependencies, other widgets, or alarm features were added. No commit, push, or publish was made.

## Baseline

- Read the applicable ancestor/project guidance locations; no `AGENTS.md` was present. Read `dev-server.log` and relevant Git history through `d6beb70` (`Add timer warning checkpoints`). The working tree was clean before edits. No previous settings-polish log or earlier rejected panel implementation was found.
- Parent-reported pre-change browser baseline at 909x854: the popover was 312px wide, overlapped the Timer, and had no close X.
- Parent-reported pre-change test baseline: 15 files / 70 tests passed in 4.36s at 20:40:56 local. Existing Vite esbuild/oxc deprecation warnings were present.
- Timer values to preserve: 05:00 duration, no warning checkpoints selected, warning sound Ding.

## Modification Ledger

1. Added `src/components/WidgetSettingsPanel.tsx` as the shared, nonmodal right-side panel. It has a titled persistent close header, constrained responsive width/height, a content-only scrolling region, initial focus on close, Escape close, outside-pointer close, and focus restoration. Added shared section and switch controls. The approved semantics are `aria-modal=false`; focus is not trapped. Reviewer: Accepted (technical). User: Pending.
2. Updated `src/widgets/Clock/Settings.tsx` to use the shared panel, grouped sections, a Digital/Analog radio choice, and consistent switches. Existing clock configuration keys and behavior remain in use. Reviewer: Accepted (technical). User: Pending.
3. Updated `src/widgets/Timer/Settings.tsx` to use the shared panel and grouped controls. Replaced the first sound layout with one sound dropdown and adjacent preview button; all existing synthesized sounds remain. Preserved warning checkpoints, warning-sound choices, custom audio upload/preview/removal, and auto-reset. Reviewer: Accepted (technical). User: Pending.
4. Updated `src/components/SettingsTriggerButton.tsx` with dialog relationship/expanded attributes for the new panel, and `src/lib/useGlobalShortcuts.ts` to suppress global shortcuts while the panel is open. Reviewer: Accepted (technical). User: Pending.
5. Synchronized the Timer duration draft when stored duration changes. Blurring an unchanged duration now leaves a running timer untouched; changed valid values retain the existing stop/reset behavior. Reviewer: Accepted (technical). User: Pending.
6. Added `src/components/WidgetSettingsPanel.test.tsx` for shortcut scoping, Escape close, and focus restoration, plus `src/widgets/Timer/Settings.test.tsx` for connected-store warning changes, preserved warning sound, duration synchronization, and unchanged-duration blur behavior. Reviewer: Accepted (technical). User: Pending.

## Rejected Attempt

- The first Timer sound layout used ten radio tiles. Reviewer: Refused. It was too tall (first draft approximately 830px high); reviewer requested a dropdown with an adjacent preview icon. That layout was replaced and is recorded here to avoid repeating it.
- No other refused or previously attempted settings changes were found in the checked project history/logs.

## Measured Checks

- Automated tests after the final code changes: 17 files / 72 tests passed, 5.08s (20:48:46 local). Existing esbuild/oxc deprecation warnings remain.
- Production build: TypeScript and Vite passed; 1,888 modules transformed; Vite build completed in 4.07s.
- `git diff --check`: passed.
- Parent-reported Clock browser review at 909x854: Analog selected the analog face and disabled 24-hour; switching to Digital and turning 24-hour off displayed 08:45 PM. Close X restored focus. Clock settings fit the viewport without scrolling. The review Clock remains on the canvas below Timer; its defaults were restored after the checks.
- Parent-reported final Timer desktop measurement: panel 400px wide by 685.33px high; content clientHeight and scrollHeight were both 619px, so no scroll was needed. The initial no-X/312px popover was the baseline above.
- Parent-reported responsive review: at 390x844 all Timer controls fit without scrolling; at 390x568 the body scrolled to Auto-reset while the close header remained visible. X closed and restored focus.
- Parent-reported Timer behavior review after a full reload: the 5 min warning could be toggled off and 2 min on; state updated and was restored to all checkpoints off with Ding retained. The +/- control changed Duration from 05:00 to 05:01 and back. With the timer running, focusing Duration and tabbing away unchanged left Pause available while the countdown advanced from 04:55 to 04:48; timer was reset to 05:00 afterward.
- Parent-reported keyboard check: pressing `z` while the close button was focused left the panel/canvas unchanged; Escape closed the panel and restored focus.
- A first test invocation used the npm wrapper that selected a Windows ARM64 Node runtime and failed before Vitest startup because its Rolldown native binding was missing. Retrying with the bundled x64 Node runtime succeeded; no dependency installation or lockfile change was made. An intermediate build also caught unsupported `exact` query options in a test; the test queries were corrected to anchored names and the final build passed.
- Custom audio upload was preserved in code; a new end-to-end upload/playback browser check was not recorded in this increment.

## Acceptance

- Reviewer acceptance: Accepted (technical; browser review and reported test/build results passed).
- User acceptance: Pending final diff.

## Follow-up: Shared Warning Sounds (2026-09-23)

- Previous restricted warning list (Chime, Gentle, Ding): Refused by user. Do not reintroduce a curated subset; the user chooses from the same sounds as the finish selector.
- Timer warning sound now offers all ten `SFX_NAMES`, the shared uploaded custom sound when present, and Visual only. The warning preview uses the same icon treatment as the finish preview and is disabled for Visual only.
- Finish and warning choices share the stored custom audio without coupling their selected sounds. Choosing a synthesized finish sound retains the upload; explicit removal clears the warning's custom choice and changes the finish choice only if it was also custom.
- Parent browser review: verified all ten built-ins in both menus, warning-only Visual only, fanfare warning selection with Bell finish unchanged, disabled preview for Visual only, and restored Ding. Parent reports the panel screenshot fits without scrolling.
- Focused Timer checks: 2 test files / 12 tests passed (21:03:36 local). Full suite: 17 test files / 75 tests passed in 5.01s (21:03:44 local). Existing Vite esbuild/oxc deprecation warnings remain.
- Production build: TypeScript and Vite passed; 1,888 modules transformed; Vite build completed in 3.88s. `git diff --check`: passed.
- Reviewer acceptance: Accepted (technical; parent browser check, focused/full tests, and build passed).
- User acceptance: Pending local review.
- No commit or push was made.

## Related Local Feature

- The local-only Background gallery implementation, storage/cleanup behavior, photo credits, reviewer adjustments, measurements, test/build results, and pending acceptance are recorded in [BACKGROUND_FEATURE_LOG.md](BACKGROUND_FEATURE_LOG.md). Existing Clock, Timer, settings, and music edits in this worktree were preserved.
