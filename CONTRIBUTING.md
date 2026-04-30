# Contributing

Thanks for helping improve WTR Lab Delulu Destroyer.

## Ground rules

- Keep the userscript lightweight and dependency-free.
- Preserve the single-file `.user.js` distribution model.
- Do not add tracking, analytics, or remote telemetry.
- Avoid changes that interfere with WTR Lab reading pages.

## Local checks

Before opening a pull request, run:

```bash
node --check "WTR Lab Delulu Destroyer.user.js"
```

Also install the script locally in your userscript manager and verify the panel opens on WTR Lab.

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
