# Changelog

## Unreleased — 2026-10-05

### Added

- Isolated iOS release evidence covering dependency installation, CocoaPods deployment-mode validation, unsigned simulator compilation, and JavaScript/Hermes export.
- Metro regression coverage for both buffer-based and file-based image assets.

### Fixed

- Added the shared design-token package to the mobile Metro watch folders so the native theme resolves during bundling.
- Updated the Metro `image-size` compatibility adapter to accept both byte buffers and file paths used by Metro's asset pipeline.

### Verified

- iOS export completed with 999 modules, 21 assets, and a 3.6 MB Hermes bundle.
- Native Debug simulator build completed successfully with the diagnostic iOS 15 deployment-target override.
- Focused regression tests and patch idempotence checks pass.

### Remaining

- Simulator runtime smoke tests, physical-device acceptance, VoiceOver, Dynamic Type, and Android validation.
- Final supported iOS minimum and toolchain decision before release promotion.
