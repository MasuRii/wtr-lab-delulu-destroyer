# 🐰 Delulu Destroyer for WTR Lab

<p align="center">
  <a href="https://github.com/MasuRii/wtr-lab-delulu-destroyer/actions/workflows/validate.yml"><img alt="Validate" src="https://github.com/MasuRii/wtr-lab-delulu-destroyer/actions/workflows/validate.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/MasuRii/wtr-lab-delulu-destroyer"></a>
  <a href="package.json"><img alt="Version" src="https://img.shields.io/github/package-json/v/MasuRii/wtr-lab-delulu-destroyer?label=version"></a>
  <a href="https://greasyfork.org/en/scripts/575938-wtr-lab-delulu-destroyer"><img alt="Greasy Fork" src="https://img.shields.io/badge/Greasy%20Fork-install-success"></a>
  <a href="#installation"><img alt="Managers: ScriptCat, Violentmonkey, Stay" src="https://img.shields.io/badge/managers-ScriptCat%20%7C%20Violentmonkey%20%7C%20Stay-blue"></a>
  <a href="https://wtr-lab.com/"><img alt="Target: wtr-lab.com" src="https://img.shields.io/badge/target-wtr--lab.com-ff0055"></a>
</p>

Tired of scrolling through WTR Lab and seeing genres, tags, or novel tropes you absolutely cannot stand? Delulu Destroyer is a lightweight, ultra-fast filter that lets you block and hide novels you have no interest in reading.

Out of sight, out of mind.

[Install from Greasy Fork](https://greasyfork.org/en/scripts/575938-wtr-lab-delulu-destroyer) · [Install from GitHub](https://github.com/MasuRii/wtr-lab-delulu-destroyer/raw/main/WTR%20Lab%20Delulu%20Destroyer.user.js)

## Preview

Proof from the Greasy Fork listing:

![Delulu Destroyer demo](https://files.catbox.moe/ariw4n.gif)

![Delulu Destroyer screenshot](https://greasyfork.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MjkxMTQxLCJwdXIiOiJibG9iX2lkIn19--48a6d1fd3b803d75aca05730004e96cd1fcd520a/Destroyer.png?locale=en)

## Features

- **Sleek floating panel**: A compact crimson rabbit launcher sits in the bottom-right corner of WTR Lab.
- **Smart input**: Type a genre, API tag, or custom keyword. The script labels each target with color-coded badges.
- **Seamless browsing**: WTR Lab navigation and infinite-scroll updates are watched so blocked novels stay hidden as pages change.
- **Auto-save**: Your blocklist, profiles, and search mode are saved locally by your userscript manager.
- **Blocklist sharing**: Copy your blocklist as text and import shared lists from other users.
- **Saved profiles**: Store multiple named blocklist profiles, switch between them when needed, and get in-panel warnings before overwriting one.
- **Safe purge**: Clearing the entire blocklist requires confirmation first.
- **iOS-aware loading**: The script avoids Stay's page-injection path and applies saved filters as soon as it loads.

## Installation

1. Install a userscript manager. Recommended options:
   - [ScriptCat](https://docs.scriptcat.org/en/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Stay for Safari](https://apps.apple.com/app/id1591620171) on iOS Safari
2. Open the [Greasy Fork script page](https://greasyfork.org/en/scripts/575938-wtr-lab-delulu-destroyer).
3. Install the script through your userscript manager.
4. Visit `https://wtr-lab.com/` and click the floating **Destroyer** button.

> [!NOTE]
> Tampermonkey may still work, but this project now prioritizes ScriptCat, Violentmonkey, and Stay compatibility.

## How to use

1. Open the panel from the floating **Destroyer** button.
2. Type a genre such as `harem`, a tag such as `tragedy`, or a custom keyword such as `system`.
3. Press Enter or click `+` to add it to your blocklist.
4. Click **Apply & Destroy** to hide matching novels.
5. Remove a block by clicking the `×` button on its badge.
6. Open **Profiles & sharing** to copy/import blocklists or save the current blocklist as a named profile.

## Smart search modes

- **Broad**: Checks novel titles, genres, and tags. This is the default and recommended mode.
- **Strict**: Checks only official genres and tags, ignoring titles.

## iOS Safari / Stay notes

Stay must be enabled in Safari settings and allowed for WTR Lab before the script can run:

1. Open **Settings → Safari → Extensions → Stay**.
2. Enable Stay and allow it for all websites or for `wtr-lab.com`.
3. Import the script from Greasy Fork or the GitHub raw URL.
4. Activate the script from Stay's **Library** tab.

The userscript metadata uses `@run-at document-end` and `@noframes`, and the source avoids `window.*` calls that make Stay switch into page-injection mode on iOS Safari.

## Compatibility

- Current userscript version: `4.9`
- Target site: `https://wtr-lab.com/*`
- Recommended managers: ScriptCat, Violentmonkey, and Stay
- Output format: bundled JavaScript userscript generated from modular TypeScript
- Browser support: modern browsers supported by the selected userscript manager

## Development

The source is modular TypeScript under `src/`. Webpack bundles it back into the distributable userscript file:

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

The script stores filter preferences and blocklist profiles locally through userscript storage, with a localStorage fallback for compatible runtimes. It does not collect analytics or send personal data to this repository owner.

> [!IMPORTANT]
> This project is an independent userscript and is not affiliated with WTR Lab.
