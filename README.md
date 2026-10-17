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

The repository includes the approved runtime portrait, original equipment geometry, CV, completed-route coordinates and public activity snapshots. Their sources and limitations are documented beside the assets. Media embeds the original 2008 Iron Man scene and The Shape of Speed in the requested order; WOO integration is pending access to the owner’s session data. A GitHub snapshot can refresh through the existing daily workflow; other snapshots are not live feeds.

Raw footage, private fitting inputs, product reference photography, discarded character studies and temporary renders are excluded. The current source does not make those old studies selectable. Earlier prototype branches are separate history and are not rewritten by this change.

## Model authoring

The self-contained runtime GLB is sufficient to run the portrait; regenerating that personal fit requires private inputs that are deliberately not in Git. `scripts/package_rory_face.py` accepts an explicit input path.

The original procedural equipment builder is reproducible with Blender’s Python:

```sh
blender --background --python tools/kitesurf/build_gear.py -- --output /tmp/hud-kitesurf-build
```

Copy its reviewed `gear.json` to `prototypes/3d-face/assets/kitesurf-gear.json` when updating. The default output goes to the ignored `.private-assets/kitesurf-build/`. This is a visual model from references, not manufacturer CAD.

## Hosting and refreshes

GitHub Pages publishes the tracked runtime bundle at https://rrwwee.github.io/iron-man-hud/. Pushes to `main`, manual runs and completed daily GitHub snapshot runs trigger `.github/workflows/pages.yml`. Tests must pass before deployment. `node tools/build-pages.mjs` packages `_site/`; it excludes untracked files, local-preview media and authoring tools.

GitHub profile fields are fetched when visitors open the site, cached for one hour, with a saved fallback. Contribution graphs refresh daily through the GitHub activity workflow, followed by a Pages deployment. An already-open page must reload to receive the new snapshot.

Codex totals and graphs use a public snapshot refreshed by a daily local Codex automation at 9 AM. `node tools/publish-codex-activity.mjs` reads the owner’s existing local Codex login, validates only approved aggregate fields, and updates the one JSON file on GitHub via the existing `gh` login. That commit triggers Pages deployment. Credentials, task text and project details never leave the local collector. The working tree is untouched. The Mac and local automation must be available; failed or incomplete collection preserves the published snapshot. An already-open page receives the new snapshot on reload.

The owner approved public YouTube embeds on 16 October 2026. No video or film audio is downloaded or rehosted. The selected uploads play through YouTube; embed availability does not establish uploader authorisation. Joseph is omitted because the tested full-film uploads block embedding. See `docs/design/HUD-RELEASE-SCOPE.md` for the earlier review scope and publication update.
