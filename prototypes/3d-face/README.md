# HUD runtime

See the [root README](../../README.md) for setup, validation, data boundaries and model-authoring instructions.

This directory is the HTTP document root. `head-viewer.js` owns the portrait renderer; `site-navigation.js` coordinates six sections and transfers; `hud-volumes.js` renders the flight globe and equipment; `hud-attitude.js` renders the tracking sphere and independent pitch ladder. Public data adapters and geometry/motion helpers have focused tests in `scripts/`.

All runtime resources are relative to this directory. Personal raw footage and old character studies are not part of this snapshot.
