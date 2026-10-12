# Free 3D face — disposable visual trial

Decision: [Validate a free 3D face in motion and expression](https://github.com/rrwwee/iron-man-hud/issues/8).

This is a rough **authored male MPFB character**, not the generic female control from the research. The dark quiff, trimmed moustache/goatee, adult age and facial proportions aim toward Tony Stark. It is an early likeness study, not a verified likeness, film asset or finished character.

## Run the viewer

From the repository root, one command:

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=hud. Blender is **not** needed to run the viewer. Three.js is vendored, so the viewer makes no CDN, inference or avatar-service requests. A local HTTP server is required for JavaScript modules and loading the GLB.

The current view uses the user's supplied movie screenshots as the composition reference: full-viewport black background, an extreme face close-up, very low ambient light, warm/cool face spotlights, and layered projected instruments near the cheeks and screen edges. The underlying head geometry is unchanged; this revision evaluates camera, lighting and HUD presence, not an improved likeness. The film screenshots are references only and are not bundled in the prototype.

Open **Trial controls** at the top right or press **H** to access the controls below. H or Escape closes the panel. The panel starts closed to preserve the cinematic composition.

- Move within the scene for continuous head, neck and independent eye motion. Leaving returns to center.
- **Blink** closes and opens the eyelids; automatic blinking is enabled initially.
- **Neutral**, **Smirk**, **Surprised**, **Skeptical** blend real facial shape keys, including matching eyebrow, beard and eyelash shapes.
- **Replay turn** runs a slow sweep, a reversal and vertical movement. Click it again to stop. Pointer movement does not interrupt replay.
- **Center** resets the pose.
- Toggle the HUD or inspection lighting. The arrows inside the controls panel switch between `?variant=hud` and `?variant=inspection` without changing the model.

`hud.js` draws the edge instruments directly onto a transparent canvas. The instruments are visual prototypes, not functional suit systems. Their slow incidental motion is suppressed when the browser requests reduced motion. `cinematic-preview.png` captures this revision; `preview.png` preserves the earlier bust composition for comparison.

## What is real and what remains rough

The head is a GLB exported from Blender 4.5.3 LTS + MPFB 2.0.18. It includes the MPFB default skeleton, independent eye joints and 52 ARKit-style facial shape controls. The viewer applies those controls directly across the relevant meshes. It is not a sprite bank or a screen-space portrait rotation.

The proportions, haircut, goatee and skin need further art direction. Some eye/lid, mouth and beard deformation combinations can look awkward. This prototype deliberately leaves them visible for evaluation. No production performance target or final asset acceptance is claimed. The GLB is about 14 MB and includes a cropped bust; it has not been optimized for shipping.

## Editable source and reproduction

- `assets/tony-head-source.blend`: editable authored character, with textures packed. Original modeling controls and uncropped source are preserved. It precedes the export-only bust/beard/cornea cleanup.
- `assets/tony-head.glb`: generated bust used by the viewer.
- `assets/tony-head-build.json`: chosen shape parameters, bone names, facial controls and mesh sizes.
- `scripts/generate_head.py`: authoring/export recipe, including explicit export-material corrections.

The temporary build environment lives under `/private/tmp/ironman-3d-tools`. It was isolated from the user's Blender settings; no system-wide Blender or MPFB install was required. To rebuild elsewhere, download Blender 4.5.3, the [MPFB 2.0.18 source](https://github.com/makehumancommunity/mpfb2/tree/v2.0.18), and the three free packs listed below. Set `IRONMAN_TOOLS` to their directory and `IRONMAN_MPFB_SRC` to the directory containing the `mpfb` Python package. Put the ZIPs in `IRONMAN_TOOLS` with names `system-assets.zip`, `faceunits01.zip`, and `bodyparts05.zip`.

```sh
blender --background --factory-startup --python-exit-code 1 --python prototypes/3d-face/scripts/generate_head.py
```

The builder extracts data only into its isolated temporary data directory. It does not save user preferences or download anything. `IRONMAN_FACE_OUT` can override its output folder. It bakes a copy, loads/interpolates facial targets, removes lower-body geometry and the opaque corneal overlay, trims the beard, fixes standard glTF material factors and exports.

## Sources and licenses

All downloaded character assets for this trial are from the MakeHuman project's CC0 packs:

- [MakeHuman system assets — CC0](https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip): base support assets, male skin, brown high-poly eyes, brows, lashes, teeth, tongue and `short01` hair.
- [Faceunits 01](https://files.makehumancommunity.org/functional/faceunits01.zip): facial deformation targets.
- [Bodyparts 05 — CC0](https://files.makehumancommunity.org/asset_packs/bodyparts05/bodyparts05_cc0.zip): `grinsegold_beard_sigmund_wip`, trimmed into the rough goatee.
- [MPFB licensing / output policy](https://github.com/makehumancommunity/mpfb2/blob/v2.0.18/LICENSE.md). MPFB code is GPL; its core graphical assets and the named asset packs are CC0.
- [Three.js 0.180.0](https://github.com/mrdoob/three.js/tree/r180), MIT; license included in `vendor/THREE-LICENSE.txt`.
- [Blender 4.5.3 download](https://mirror.blender.org/release/Blender4.5/), checked against its official SHA-256 manifest. Blender is a build tool, not bundled in the prototype.

No commercial game assets, actor scan, paid character, or hosted avatar API were used. This record describes the source materials, not a claim of affiliation with the film character or actor.

The decision stays open until the user has judged the head's likeness, continuous motion and expression quality in the HUD.

## Verification performed

The builder completed in Blender and the generated GLB passed structural checks for its length, finite bounds, 52 facial controls, head/eye joints and opaque face materials. In the desktop browser, checked left/right replay motion, smirk and surprise deformations, a manual blink, automatic blinking, and the two lighting states. No browser console errors were reported in that pass. JavaScript syntax and Git whitespace checks passed. No frame-rate or device-coverage benchmark was performed.
