# Contributing

Thanks for helping improve WTR Lab Delulu Destroyer.

## Ground rules

- Keep the runtime userscript lightweight.
- Preserve the single-file `.user.js` distribution output.
- Make source changes in modular TypeScript under `src/`.
- Do not add tracking, analytics, or remote telemetry.
- Avoid changes that interfere with WTR Lab reading pages.

## Local checks

Before opening a pull request, run:

```bash
npm install
npm run validate
```

Also install the generated script locally in ScriptCat or Violentmonkey and verify the panel opens on WTR Lab. For iOS compatibility changes, check Stay's supported metadata/API list in `C:/Repository/Stay/README-EN.md`.

## Pull requests

1. Describe the problem and the behavior change.
2. Include manual test notes for affected WTR Lab pages.
3. Keep changes focused on one issue or feature.
4. Update `CHANGELOG.md` when user-facing behavior changes.

## Issue reports

Please include:

- Browser and userscript manager versions
- WTR Lab page URL pattern where the issue appears
- Steps to reproduce
- Expected behavior
- Actual behavior
