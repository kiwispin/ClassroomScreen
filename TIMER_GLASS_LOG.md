# Timer Frosted-Glass Trial Log

## Release Approval (2026-09-23)

- User: Accepted ("Looks great!"); explicitly requested pushing all changes so far. This supersedes the pending/local-only statuses recorded below.
- Combined pre-commit checks: 98 tests passed; TypeScript and production build passed.

Scope: optional Timer-only frosted-glass appearance configured from the existing Color theme popover. No dependency, preset-format version, non-Timer appearance, commit, or push was added.

## Behavior

- Existing Timer presets remain opaque by default. Missing `frostedGlass` and `glassOpacity` fields require no migration; opacity defaults to 75% only when glass is enabled.
- The Timer popover offers a Frosted glass switch and a 20-100% opacity slider in 5% steps. It reuses the existing settings switch and volume-slider styling. Non-Timer theme popovers do not show these controls.
- Glass alpha and a 12px backdrop blur are applied to the Timer tile background only. The tile itself and its contents are not faded; Timer size, controls, text, and other widgets retain their existing behavior.
- Opacity is clamped to the slider bounds. Non-finite stored values use the 75% default. Preset JSON remains version 1: optional Timer config fields round-trip as ordinary config, while older configs remain unchanged.

## Review Feedback

- The initial native-checkbox presentation was refused by the reviewer as visually inconsistent. It was replaced with the existing `SettingsToggle`; no behavioral or layout approach was refused.
- Parent's browser measurements on the 909x854 viewport and 480x200 Timer with Midnight (`rgb(15, 23, 42)`): at 20%, computed background was `rgba(15, 23, 42, 0.2)` and `backdrop-filter` was `blur(12px)`; at 100%, the computed background was `rgb(15, 23, 42)`. At both ends tile opacity remained 1 and dimensions remained 480x200.
- Parent set opacity to 75%, reloaded, and verified the glass toggle remained on and the slider remained at 75%. Default/light glass was briefly selected for a screenshot, then Midnight was restored.
- Parent verified that clicking the styled toggle label turns glass off and restores the exact baseline: `rgb(15, 23, 42)`, no backdrop filter, opacity 1, and 480x200 dimensions. Glass was turned back on at 75% afterward.
- At 390x844, the expanded popup measured x=68.67, y=83, width=265.33, height=351.33; it fit fully with no scrollbar, and the screenshot was visually checked. The viewport was reset afterward.
- The fixed-size canvas Timer itself extends beyond the mobile viewport; this is pre-existing and out of scope for the Timer glass trial.

## Verification

- Focused tests: 3 files / 13 tests passed.
- Full suite: 23 files / 98 tests passed using the explicit x64 Node runtime at `C:\Users\master\Documents\Classroom Screen\.tools\Node\node.exe`.
- TypeScript build passed using that x64 Node runtime.
- Vite production build passed: 1,890 modules transformed; completed in 4.14s.
- `git diff --check` passed. Git printed existing LF/CRLF normalization warnings only. Vitest printed the existing Vite esbuild/oxc deprecation warnings.
- No dependencies were installed or lockfiles changed.

## Acceptance

- Reviewer: Accepted for local review; code/tests, background-only rendering, persistence, baseline restoration, and desktop/mobile popup fit were verified.
- User: Pending final review.
- No commit or push was made.
