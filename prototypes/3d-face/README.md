# Free 3D face — disposable visual trial

Decision: [Validate a free 3D face in motion and expression](https://github.com/rrwwee/iron-man-hud/issues/8).

This is a rough **authored male MPFB character**, not the generic female control from the research. The dark quiff, trimmed moustache/goatee, adult age and facial proportions aim toward Tony Stark. It is an early likeness study, not a verified likeness, film asset or finished character.

## Run the viewer

From the repository root, one command:

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=hud. Blender is **not** needed to run the viewer. Three.js is vendored, so the viewer makes no CDN, inference or avatar-service requests. A local HTTP server is required for JavaScript modules and loading the GLB.

The current view uses the user's supplied movie screenshots as the composition reference: a 2:1 widescreen shot against black, a close view of the front of the face, warm/cool frontal spotlights, and layered projected instruments near the cheeks and screen edges. Narrow windows letterbox the shot rather than turning it into a full-head portrait. The exported mesh physically excludes the ears, neck, rear head, hair, collar and hidden mouth geometry. This evaluates framing and rendering cost, not an improved likeness. The film screenshots are references only and are not bundled in the prototype.

Open **Trial controls** at the top right or press **H** to access the controls below. H or Escape closes the panel. The panel starts closed to preserve the cinematic composition.

- Move within the scene for continuous head and independent eye motion. Leaving returns to center. Head turns are bounded to roughly ±12° yaw and ±7° pitch because the unseen sides/back have been removed.
- **Blink** closes and opens the eyelids; automatic blinking is enabled initially.
- **Neutral**, **Smirk**, **Surprised**, **Skeptical** blend real facial shape keys, including matching eyebrow, beard and eyelash shapes.
- **Replay turn** runs a slow sweep, a reversal and vertical movement. Click it again to stop. Pointer movement does not interrupt replay.
- **Center** resets the pose.
- Toggle the HUD or inspection lighting. The arrows inside the controls panel switch between `?variant=hud` and `?variant=inspection` without changing the model.

`hud.js` draws the edge instruments directly onto a transparent canvas. The instruments are visual prototypes, not functional suit systems. The HUD is now cached between resize/expression changes, with no idle animation loop. `front-face-preview.png` captures this revision; `cinematic-preview.png` and `preview.png` preserve earlier compositions for comparison.

## What is real and what remains rough

The face is a GLB exported from Blender 4.5.3 LTS + MPFB 2.0.18. Its reduced rig has four bones (root, head and two eyes), with 14 facial shape controls retained for the visible actions. The viewer applies those controls directly across the relevant meshes. It is not a sprite bank or a screen-space portrait rotation.

The proportions, goatee and skin need further art direction. Some eye/lid, mouth and beard deformation combinations can look awkward. No final asset acceptance is claimed. The exported GLB is 2,211,364 bytes (about 2.2 MB), with 9,300 triangles in five meshes. The original was 14,429,308 bytes, 25,878 triangles, nine meshes, 163 bones and 52 maximum facial targets.

The viewer caps its internal render buffer to 960×600 or smaller, never above a pixel ratio of one. Shadows are disabled. It renders at up to 30 fps during pointer motion, expression changes or blinks, then stops issuing render calls while settled. Automatic blinks wake the renderer briefly via a timer. Hidden documents cancel both animation and blink scheduling. A local shader fades only the front face into black; it does not require a shadow pass.

## Editable source and reproduction

- `assets/tony-head-source.blend`: editable authored character, with textures packed. Original modeling controls and uncropped source are preserved. It precedes the export-only bust/beard/cornea cleanup.
- `assets/tony-head.glb`: generated bust used by the viewer.
- `assets/tony-head-build.json`: chosen shape parameters, bone names, facial controls and mesh sizes.
- `scripts/generate_head.py`: authoring/export recipe, including explicit export-material corrections.
- `scripts/reduce_to_face.py`: front-surface crop, reduced skeleton/shape controls, and export-only texture resizing. Original editable textures remain packed in the source file and are not downloaded by the viewer.
- `scripts/audit_face_budget.py`: a repeatable check that rejects oversized visitor assets.

The temporary build environment lives under `/private/tmp/ironman-3d-tools`. It was isolated from the user's Blender settings; no system-wide Blender or MPFB install was required. To rebuild elsewhere, download Blender 4.5.3, the [MPFB 2.0.18 source](https://github.com/makehumancommunity/mpfb2/tree/v2.0.18), and the three free packs listed below. Set `IRONMAN_TOOLS` to their directory and `IRONMAN_MPFB_SRC` to the directory containing the `mpfb` Python package. Put the ZIPs in `IRONMAN_TOOLS` with names `system-assets.zip`, `faceunits01.zip`, and `bodyparts05.zip`.

```sh
blender --background --factory-startup --python-exit-code 1 --python prototypes/3d-face/scripts/generate_head.py
```

The builder extracts data only into its isolated temporary data directory. It does not save user preferences or download anything. `IRONMAN_FACE_OUT` can override its output folder. It bakes a copy, loads/interpolates facial targets, removes unseen geometry and the opaque corneal overlay, trims the beard, prunes the rig and expressions, resizes textures, fixes standard glTF material factors and exports.

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

The earlier full-head builder completed in Blender and passed structural checks for its length, finite bounds, 52 facial controls, head/eye joints and opaque face materials. The desktop browser checks covered replay, expressions, blinking and lighting. That earlier version is retained in Git history; it is superseded by the smaller front-only export described below.

For the front-face reduction, `python3 prototypes/3d-face/scripts/audit_face_budget.py` first failed on the original asset, then passed on the reduced asset. The checks require ≤3 MB, ≤4 bones, ≤16 morph targets, ≤12,000 triangles and ≤6 meshes. At a 1280×720 test viewport, the earlier buffer used 3,686,400 pixels and a shadow pass; the reduced buffer used 459,840 pixels without shadows. These are measured workload reductions, not an FPS guarantee for every computer. Browser frame-counter checks also verify that settled motion with auto-blink off does not continue rendering.

In the final bounded idle check, six DOM samples 200 ms apart all reported frame 311 and `active=false`. Manual blink and surprise resumed rendering, and the browser reported no errors. The budget check also asserts front-face bounds exclude neck, ears and rear geometry. JavaScript syntax and Git whitespace checks passed.
