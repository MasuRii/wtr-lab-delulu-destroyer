# WTR Lab Delulu Destroyer

A lightweight Tampermonkey userscript for WTR Lab that helps hide novels and list items matching genres, tags, or custom keywords you do not want to see.

[Install the userscript](https://github.com/MasuRii/wtr-lab-delulu-destroyer/raw/main/WTR%20Lab%20Delulu%20Destroyer.user.js)

## Features

- Floating WTR Lab control panel with quick show/hide access
- Block by built-in WTR genres, discovered tags, or custom keywords
- Broad and strict matching modes
- Persistent local blocklist through Tampermonkey storage
- Skips chapter, library, news, and most profile pages to avoid disrupting reading
- No build step and no external dependencies

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/).
2. Open the install link above.
3. Confirm the userscript installation in your userscript manager.
4. Visit `https://wtr-lab.com/` and use the **Destroyer** launcher in the bottom-right corner.

> [!NOTE]
> This project is an independent userscript and is not affiliated with WTR Lab.

## Usage

1. Open WTR Lab.
2. Click **Destroyer**.
3. Choose a genre, tag, or custom keyword.
4. Add it to the blocklist.
5. Switch match mode if you need broader or stricter filtering.

Your blocklist is stored locally by the userscript manager. Removing or resetting the script may remove saved preferences depending on your manager settings.

## Compatibility

- Target site: `https://wtr-lab.com/*`
- Userscript managers: Tampermonkey-compatible managers
- Browser support: Modern Chromium, Firefox, and Edge builds supported by your userscript manager

## Development

This repository intentionally keeps the userscript as a single distributable file.

```bash
node --check "WTR Lab Delulu Destroyer.user.js"
```

Commit changes to the `.user.js` file directly. GitHub Actions validates basic userscript syntax and required metadata on every push and pull request.

## Privacy

The script stores filter preferences locally with `GM_setValue` / `GM_getValue`. It does not collect analytics or send personal data to this repository owner.
