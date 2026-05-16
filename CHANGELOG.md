# Changelog

All notable changes to this project are documented here.

## [5.1] - 2026-05-16

### Added

- Added a hide button (–) in the panel header that minimizes the floating Destroyer launcher down to a small rabbit dot in the corner.
- Added a click/tap on the minimized rabbit dot to bring the full launcher back.
- Persist the minimized state across page loads so the widget stays out of the way until you choose to show it again.
- Added drag-to-reposition for the launcher, the minimized dot, and the panel header. Works with mouse, touch, and pen via Pointer Events, snaps inside the viewport, and remembers the position across reloads.

## [5.0] - 2026-05-02

### Added

- Added blocklist copy/import sharing and saved blocklist profiles.
- Added profile overwrite prompts and reset the selected profile after blocklist edits to prevent accidental saved-profile replacement.
- Reused the custom Destroyer warning modal for profile save, load, and delete confirmations with consistent warning titles and copy.
- Rebuilt the distributable userscript for release version 5.0.

## [4.9] - 2026-04-30

### Changed

- Improved blocking accuracy by caching WTR Lab JSON metadata and matching API tag IDs, genre IDs, and normalized search text when available.
- Improved purge and block removal behavior so cards hidden by Delulu Destroyer can be restored without reloading the page.
- Rebuilt the distributable userscript for release version 4.9.

## [4.8] - 2026-04-30

### Changed

- Refactored the userscript source into modular TypeScript under `src/`.
- Added Webpack bundling that outputs `WTR Lab Delulu Destroyer.user.js`.
- Updated userscript metadata namespace to `https://docs.scriptcat.org/en/`.
- Prioritized ScriptCat, Violentmonkey, and Stay compatibility in metadata and documentation.
- Improved Stay for Safari compatibility by avoiding Stay's page-injection trigger and applying saved filters before tag autocompletion finishes loading.
- Corrected README wording from owl to rabbit.
- Updated README content to align with the Greasy Fork listing.
- Added Greasy Fork demo GIF, screenshot proof, and centered repository badges to the README.

### Added

- Public repository standard files: README, license, contribution guide, security policy, code of conduct, issue templates, pull request template, and validation workflow.
- Root `AGENTS.md` with repository-specific guidance for future coding agents.

## [4.7] - 2026-04-29

### Existing userscript behavior

- Floating WTR Lab filtering panel.
- Genre, tag, and custom keyword blocking.
- Local blocklist persistence through userscript storage.
