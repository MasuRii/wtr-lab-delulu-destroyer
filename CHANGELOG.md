# Changelog

All notable changes to this project are documented here.

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
