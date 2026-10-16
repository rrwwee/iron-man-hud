# Personal HUD

Rory’s interactive personal website: a fitted portrait with blinking and cursor-directed gaze, six visor sections, completed-flight globe, kitesurf equipment, CV and public activity instruments.

## Run locally

Requirements: Node.js 22+ and Python 3. No npm dependencies or install step.

```sh
npm test
npm run test:python
npm run serve
```

Open http://127.0.0.1:4188/. The static entry point is `prototypes/3d-face/index.html`; it must be served over HTTP, not opened as a file. The vendored Three.js license is in `prototypes/3d-face/vendor/THREE-LICENSE.txt`.

## Data and assets

The repository includes the approved runtime portrait, original equipment geometry, CV, completed-route coordinates and public activity snapshots. Their sources and limitations are documented beside the assets. Media is currently empty; WOO integration is pending access to the owner’s session data. A GitHub snapshot can refresh through the existing daily workflow; other snapshots are not live feeds.

Raw footage, private fitting inputs, product reference photography, discarded character studies and temporary renders are excluded. The current source does not make those old studies selectable. Earlier prototype branches are separate history and are not rewritten by this change.

## Model authoring

The self-contained runtime GLB is sufficient to run the portrait; regenerating that personal fit requires private inputs that are deliberately not in Git. `scripts/package_rory_face.py` accepts an explicit input path.

The original procedural equipment builder is reproducible with Blender’s Python:

```sh
blender --background --python tools/kitesurf/build_gear.py -- --output /tmp/hud-kitesurf-build
```

Copy its reviewed `gear.json` to `prototypes/3d-face/assets/kitesurf-gear.json` when updating. The default output goes to the ignored `.private-assets/kitesurf-build/`. This is a visual model from references, not manufacturer CAD.

## Release boundary

This PR prepares source for review; it does not publish the site. The checks workflow only tests. No GitHub Pages deployment workflow is included. See `docs/design/HUD-RELEASE-SCOPE.md` for the accepted scope and remaining work.
