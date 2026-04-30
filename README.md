# 🦉 Delulu Destroyer for WTR Lab

Tired of scrolling through WTR Lab and seeing genres, tags, or novel tropes you absolutely cannot stand? Delulu Destroyer is a lightweight, ultra-fast filter that lets you block and hide novels you have no interest in reading.

Out of sight, out of mind.

[Install from Greasy Fork](https://greasyfork.org/en/scripts/575938-wtr-lab-delulu-destroyer) · [Install from GitHub](https://github.com/MasuRii/wtr-lab-delulu-destroyer/raw/main/WTR%20Lab%20Delulu%20Destroyer.user.js)

## Features

- **Sleek floating panel**: A compact crimson owl launcher sits in the bottom-right corner of WTR Lab.
- **Smart input**: Type a genre, API tag, or custom keyword. The script labels each target with color-coded badges.
- **Seamless browsing**: WTR Lab navigation and infinite-scroll updates are watched so blocked novels stay hidden as pages change.
- **Auto-save**: Your blocklist and search mode are saved locally by your userscript manager.
- **Safe purge**: Clearing the entire blocklist requires confirmation first.

## Installation

1. Install a userscript manager. Recommended options:
   - [ScriptCat](https://docs.scriptcat.org/en/)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Open the [Greasy Fork script page](https://greasyfork.org/en/scripts/575938-wtr-lab-delulu-destroyer).
3. Install the script through your userscript manager.
4. Visit `https://wtr-lab.com/` and click the floating **Destroyer** button.

> [!NOTE]
> Tampermonkey may still work, but this project now prioritizes ScriptCat and Violentmonkey compatibility.

## How to use

1. Open the panel from the floating **Destroyer** button.
2. Type a genre such as `harem`, a tag such as `tragedy`, or a custom keyword such as `system`.
3. Press Enter or click `+` to add it to your blocklist.
4. Click **Apply & Destroy** to hide matching novels.
5. Remove a block by clicking the `×` button on its badge.

## Smart search modes

- **Broad**: Checks novel titles, genres, and tags. This is the default and recommended mode.
- **Strict**: Checks only official genres and tags, ignoring titles.

## Compatibility

- Target site: `https://wtr-lab.com/*`
- Recommended managers: ScriptCat and Violentmonkey
- Output format: bundled JavaScript userscript generated from modular TypeScript
- Browser support: modern browsers supported by the selected userscript manager

## Development

The source is now modular TypeScript under `src/`. Webpack bundles it back into the distributable userscript file:

```bash
npm install
npm run build
npm run validate
```

Important files:

- `src/index.ts` - userscript bootstrap
- `src/app.ts` - filtering, UI state, routing, and event behavior
- `userscript.metadata.cjs` - userscript metadata header
- `webpack.config.cjs` - bundles TypeScript into `WTR Lab Delulu Destroyer.user.js`

## Privacy

The script stores filter preferences locally through userscript storage, with a localStorage fallback for compatible runtimes. It does not collect analytics or send personal data to this repository owner.

> [!IMPORTANT]
> This project is an independent userscript and is not affiliated with WTR Lab.
