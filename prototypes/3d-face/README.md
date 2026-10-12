# Free 3D face — disposable visual trial

Decision: [Validate a free 3D face in motion and expression](https://github.com/rrwwee/iron-man-hud/issues/8).

The default is now a reduced **Nathang30 Tony Stark head**, with custom lightweight expression controls. The previous MPFB trial remains available at `?model=mpfb&variant=hud` for comparison. Neither is a finished film asset or a validated final choice.

## Current Nathang30 candidate

The user's two downloads are organised under `source-assets/nathang30/`, with checksums and acquisition notes. The 17,067,128-byte GLB and 39,101,334-byte original ZIP are preserved unchanged and ignored by Git, alongside safely extracted OBJ/textures and the editable `head-trial.blend`. The originals remain local; the small derivative has its own [attribution and license notice](assets/NATHANG30-LICENSE.md).

The actual GLB has no skeleton, morphs or animations. It contains a 43,132-triangle head/eye/mouth assembly within a 68,484-triangle suited body. The OBJ is also static. The head does include separate fitted eye surfaces and a wrapped photographic atlas. Its unused eye-atlas discs are seams on the backs of the eyes, **not closed eyelids**.

`scripts/build_nathang30.py` isolates the face and original eye surfaces, removes the body, ears, neck, rear scalp and unseen mouth parts, reduces the head while preserving temple/cheek volume, resizes the atlas to 2048×1024 and authors seven subtle brow/mouth controls plus two eye-closure shapes. The viewer turns the actual geometry through ±35° yaw and ±7° pitch. No floating photographic eye plates from the previous version are used.

Blinking is deliberately labelled approximate: a matched, generated 512×280 closed-eye texture wipes over the fitted eye surfaces and adjacent socket skin, while two shape keys retract the eye domes into the sockets. Small gaze changes shift the original iris texture within those same surfaces. This is not a full anatomical eyelid rig, independently rotating anatomical eyeballs, or a lip-sync system. The source's texture softness, painted highlights, eye-surface shape and limited mouth articulation remain visible, especially in inspection light.

Press **H** for controls. **Turn left/right** holds a wide view; **Replay turn** sweeps and reverses; **Hold blink** exposes the lid treatment for inspection. **Smirk**, **Surprised**, and **Skeptical** use the new geometry morphs. **Compare previous MPFB head** opens the earlier trial. The primary question is whether this is a better shape/likeness base before investing in more eye anatomy work.

Measured runtime assets: **634,456 bytes** including the eyelid image, **6,545 triangles**, **three draw calls**, no bones and nine authored morphs across three meshes. The existing ≤960×600 framebuffer cap, ≤1 pixel ratio, no shadows, ≤30 fps during motion, hidden-tab pause and idle rendering stop remain. These describe bounded workload, not measured FPS on the user's computer.

Rebuild the candidate with the preserved GLB in place:

```sh
blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python prototypes/3d-face/scripts/build_nathang30.py
python3 prototypes/3d-face/scripts/audit_nathang30.py
```

`scripts/prepare_nathang30_lids.py` records the generated eyelid crop; `assets/nathang30-lids-provenance.json` records its source and crop. The atlas is embedded in the GLB, not fetched separately at runtime. The derived assets are **CC BY-NC-SA 4.0**, distinct from the old CC0-based MPFB work and unrelated source code. Keep this candidate within the noncommercial trial scope.

Browser validation for this candidate: neutral, smirk, surprise and skeptical controls responded; both wide turns and held blink were visually checked. A normal blink reached `blinkPeak=1.000`. At the normal 1280×720 viewport the renderer reported 460,800 pixels, three draw calls and 6,545 triangles. With automatic blinking off, separate settled observations retained the same frame count. The browser logged no warnings or errors. `nathang30-preview.png` captures the current HUD. Both the new and old asset-budget scripts, JavaScript syntax and Git whitespace checks pass. Final visual acceptance is still pending.

## Previous MPFB trial record

The remaining sections document the earlier authored MPFB face and its iterations. Their geometry/budget descriptions apply to the comparison route, not the current default.

## Run the viewer

From the repository root, one command:

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory prototypes/3d-face
```

Open http://127.0.0.1:4188/?variant=hud. Blender is **not** needed to run the viewer. Three.js is vendored, so the viewer makes no CDN, inference or avatar-service requests. A local HTTP server is required for JavaScript modules and loading the GLB.

The current view uses the user's supplied movie screenshots as the composition reference: a 2:1 widescreen shot against black, a close view of the front of the face, warm/cool frontal spotlights, and layered projected instruments near the cheeks and screen edges. Narrow windows letterbox the shot rather than turning it into a full-head portrait. The exported mesh physically excludes the ears, neck, rear head, hair, collar and hidden mouth geometry. The film screenshots are references only and are not bundled in the prototype.

Open **Trial controls** at the top right or press **H** to access the controls below. H or Escape closes the panel. The panel starts closed to preserve the cinematic composition.

- Move within the scene for continuous head and independent eye motion. The eyes acquire the target before the head and compensate as the head catches up, with eased motion instead of an instantaneous eye rotation. Leaving returns to center. Head turns are bounded to roughly ±12° yaw and ±7° pitch because the unseen sides/back have been removed.
- **Blink** closes and opens the eyelids with a quicker close and softer reopen; automatic blinking uses irregular intervals and occasional double blinks. **Slow blink preview** slows only the next blink by four times for inspection; it starts off.
- **Neutral**, **Smirk**, **Surprised**, **Skeptical** blend real facial shape keys. The photographed skin, brows and facial hair deform with that surface; the eyes rotate independently.
- **Replay turn** runs a slow sweep, a reversal and vertical movement. Click it again to stop. Pointer movement does not interrupt replay.
- **Center** resets the pose.
- Toggle the HUD or inspection lighting. The arrows inside the controls panel switch between `?variant=hud` and `?variant=inspection` without changing the model.

`hud.js` draws the edge instruments directly onto a transparent canvas. The instruments are visual prototypes, not functional suit systems. The HUD is cached between resize/expression changes, with no idle animation loop. `likeness-preview.png` captures this revision; the other previews preserve earlier compositions for comparison.

## What is real and what remains rough

The face is a GLB exported from Blender 4.5.3 LTS + MPFB 2.0.18. Its reduced rig has four bones (root, head and two eyes), with 14 facial shape controls retained for the visible actions. The viewer applies those controls directly across the relevant meshes. It is not a sprite bank or a screen-space portrait rotation.

The generated portrait is projected onto neutral-pose UVs on the front of the face and eyes. A separate 512×170 closed-eyelid strip prevents the open-eye photo from stretching over closing lids. Its lookup follows the deformed face position; it blends in only around the lids during a blink. Full closure suppresses eye-wide and squint expression weights, including during surprise. Pores, wrinkles and individual facial hairs are image detail, without extra hair geometry, normal maps or runtime AI. The old brow, lash and beard cards are removed. Lips are thinner, and eye surfaces have lower roughness. This improves the frontal likeness but does not make the underlying geometry an actor scan. Wide turns, extreme expressions, the mouth interior and eye/lid edges still need art direction. No final asset acceptance is claimed.

The exported GLB is 944,136 bytes (about 0.94 MB), with 8,224 triangles, two meshes, two draw calls and one embedded 1024×1024 JPEG shared by skin and eyes. The new eyelid strip adds 20,406 bytes, making the total face asset download 964,542 bytes (about 0.96 MB). It adds one small texture and a local texture sample during blinks, but no geometry, bones, morphs, draw calls or rendering passes. The previous front-only version was 2,211,364 bytes and 9,300 triangles in five meshes. The original was 14,429,308 bytes, 25,878 triangles, nine meshes, 163 bones and 52 maximum facial targets.

The viewer caps its internal render buffer to 960×600 or smaller, never above a pixel ratio of one. Shadows are disabled. It renders at up to 30 fps during pointer motion, expression changes or blinks, then stops issuing render calls while settled. Automatic blinks wake the renderer briefly via a timer. Hidden documents cancel both animation and blink scheduling. A local shader fades only the front face into black; it does not require a shadow pass. Texture anisotropy is capped at four; there are no additional lighting or postprocessing passes.

## Editable source and reproduction

- `assets/tony-head-source.blend`: editable authored character, with textures packed. Original modeling controls and uncropped source are preserved. It precedes the export-only bust/beard/cornea cleanup.
- `assets/tony-head.glb`: generated bust used by the viewer.
- `assets/tony-head-build.json`: chosen shape parameters, bone names, facial controls and mesh sizes.
- `assets/closed-eyelids.jpg`: 512×170 matched blink texture (20,406 bytes). Its generation and crop coordinates are recorded in `assets/closed-eyelids-provenance.json`.
- `scripts/prepare_eye_patch.py`: reproducible cropping and JPEG encoding of the generated closed-eye portrait in Blender.
- `assets/tony-diffuse.jpg`: generated portrait compressed to a 1024×1024 build input; embedded in the GLB, not fetched separately by the viewer.
- `assets/tony-diffuse-provenance.json`: generation prompt, origin and conversion record. Original generation is preserved outside the repo by the imagegen tool.
- `scripts/generate_head.py`: authoring/export recipe, including explicit export-material corrections.
- `scripts/reduce_to_face.py`: front-surface crop, reduced skeleton/shape controls, and export-only texture resizing. Original editable textures remain packed in the source file and are not downloaded by the viewer.
- `scripts/apply_likeness.py`: removes the old hair cards and maps the generated portrait to the face and separate animated eyeballs after the crop. The `.blend` preserves the editable MPFB source; rerunning the builder applies this export step.
- `scripts/audit_face_budget.py`: a repeatable check that rejects oversized visitor assets.

The temporary build environment lives under `/private/tmp/ironman-3d-tools`. It was isolated from the user's Blender settings; no system-wide Blender or MPFB install was required. To rebuild elsewhere, download Blender 4.5.3, the [MPFB 2.0.18 source](https://github.com/makehumancommunity/mpfb2/tree/v2.0.18), and the three free packs listed below. Set `IRONMAN_TOOLS` to their directory and `IRONMAN_MPFB_SRC` to the directory containing the `mpfb` Python package. Put the ZIPs in `IRONMAN_TOOLS` with names `system-assets.zip`, `faceunits01.zip`, and `bodyparts05.zip`.

```sh
blender --background --factory-startup --python-exit-code 1 --python prototypes/3d-face/scripts/generate_head.py
```

The builder extracts data only into its isolated temporary data directory. It does not save user preferences or download anything. `IRONMAN_FACE_OUT` can override its output folder. It bakes a copy, loads/interpolates facial targets, removes unseen geometry and the opaque corneal overlay, trims the beard, prunes the rig and expressions, resizes textures, fixes standard glTF material factors and exports.

## Sources and licenses

The underlying character assets are from the MakeHuman project's CC0 packs. The new face appearance is AI-generated using the user's film reference as likeness guidance; it is not a copied movie frame or a MakeHuman texture. Its origin is recorded separately and should not be represented as a CC0 MakeHuman asset.

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

For the likeness revision, the budget check passes at 944,136 bytes / 8,224 triangles / four bones / 14 controls / two meshes. At the same 1280×720 test viewport, six samples 200 ms apart all reported frame 55, `active=false`, 459,840 framebuffer pixels and two draw calls. Neutral, smirk, surprise, blink and replay were checked in the browser. These verify bounded rendering work, not the user's device FPS or final visual acceptance.

For the eye-motion revision, the asset audit includes the external eyelid strip and passes at 964,542 bytes total. Normal-speed surprise blinking reached full closure for both lids (`blinkPeak=1.000`). A slow preview visually confirmed the closed-lid texture. The replay showed gaze counter-rotation as the head turned. Six idle samples 200 ms apart all stayed at frame 41, with two draw calls, 8,224 triangles and 154,568 pixels in the default browser pane. No browser warnings/errors were logged. This is bounded-work verification, not a measured FPS promise. `blink-preview.png` captures the closed lids.

## Photographic eye-surface comparison

The user identified the remaining issue as eye texture/overall appearance. The new default **Photographic eyes** treatment replaces the visible eyeballs with two shallow, feathered photographic patches attached to the head. It removes the extra glassy highlight and masks the mismatch between the generic eye socket and the portrait. It reuses the existing face and closed-eyelid textures; no image download was added. The eyes still follow the target through a small local texture displacement, while blinking blends the existing closed-eye texture.

The checkbox in Trial controls switches back to the earlier globes for direct comparison. Both versions remain loaded for this decision prototype, but only the selected surface is drawn. The new surface has 128 triangles versus the globes' 1,060: the visible scene falls from 8,224 to 7,292 triangles, retaining two draw calls. This is a visual trial, not a claim that the user has accepted the eyes. Extreme eyelid expressions remain limited by the photographic treatment.

`eye-surface.js` contains the comparison surface. The versioned module URLs ensure a reload picks up a new trial instead of retaining an older cached module. The asset-budget script still measures the complete comparison GLB, including its hidden original eyes. Runtime DOM counters report the selected visible geometry.

Verified at the normal 1280×720 browser size: the photographic option reports 7,292 triangles, two draw calls and 460,800 framebuffer pixels. Six idle samples 200 ms apart stayed at frame 2 and `active=false`. Turns and slow-blink closure were visually checked; the browser logged no warnings/errors. `eye-appearance-preview.png` shows the new default. The comparison remains open for the user's visual judgment.

## Relaxed resting eyes

**Relaxed gaze** is enabled by default in Trial controls. It lowers the photographic upper eyelid without shrinking the iris: a curved lid boundary samples the existing closed-eyelid strip, leaving the lower lid alone. A small left/right difference avoids exact symmetry. The surprise expression eases this rest treatment away so the eyes can open fully, and full blinks still replace the eye region with the closed texture. Uncheck **Relaxed gaze** for the earlier wide-eyed appearance.

No model or texture assets were added. The upper-lid shader samples the same small eyelid texture only where needed. The face assets remain 964,542 bytes; visible geometry stays at 7,292 triangles and two draw calls with the same resolution and idle limits. This is not a measured device-FPS guarantee.

Validation: neutral and surprise were visually compared, normal-speed blinking reached `blinkPeak=1.000`, and six 200 ms idle samples stayed at frame 40 with `active=false`, two draw calls and 460,800 framebuffer pixels. Browser warnings/errors, syntax and whitespace checks were clear; the asset audit passed. `relaxed-eye-preview.png` captures the resting look. Final visual acceptance remains with the user.

The next feedback was that the rest pose looked sleepy and the eyes protruded. The resting-lid amount is now 0.60 (right side 0.57), down from 1.00/0.95. `alert-eye-preview.png` captures this small adjustment. No geometry or texture assets changed.

The protrusion is a structural limit of the current comparison: the photographic patch peaks at Z=0.155 m, while a sample of 124 front-lid vertices around both eyes has median Z=0.1426 m and maximum Z=0.1480 m. The patch was placed forward to hide the mismatched generic socket. Moving it backward alone would reveal that socket again. This prototype combines an MPFB face, a frontal projected photograph and separate photographic eye patches; its layers do not share an authored anatomical fit. The next model decision should choose a coherent shallow photographic face with integrated eye regions for mostly frontal movement, or a matched full 3D head/texture/eye/lid rig if large turns are essential. The current trial does not establish acceptance of either replacement.
