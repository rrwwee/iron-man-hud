# Full-screen volumetric HUD — disposable trial

User direction: use the supplied suit, make the globe and supporting HUD genuinely three-dimensional, show a personal location trail, remove page chrome/settings and remove or replace the eye marker.

Run `python3 -m http.server 4188 --directory prototypes/3d-face`, then open:

http://127.0.0.1:4188/?variant=visor&mode=menu&hudSpace=curved&revision=volume-5

## Current experience

- The scene occupies the complete viewport. The old header, comparison footer and hints are hidden; diagnostic controls are available only with the explicit `debug=1` URL switch. The normal experience uses the existing dark cinematic lighting and gentle movement, with no sound/motion/lighting settings instrument.
- The main radial has five entries. Source code is removed from the index and placed inside About with asset credits. The old eye marker is removed.
- The globe is actual scene geometry: latitude/longitude lines, coastlines, seven point markers, a selected-pin ring and two orbital rings. It uses the same renderer and HUD world transform, not the former canvas globe projection.
- Scroll over the globe or its adjacent curved place selector to visit the next/previous place. The globe turns to that location. Click the globe/current place to open its story in the curved HUD. The seven stops are Galway; St Michaels, Maryland; Winter Harbor, Maine; UC Santa Barbara; Forest City, Malaysia; Edinburgh; and San Francisco. Labels and minimal details come directly from the user's answers. Coordinates are approximate city/campus positions, not live GPS or specific residential addresses.
- The supplied Mark VII armor is a true 3D feature-edge model. Drag it to rotate; click it or “Separate armor” to separate/reassemble its modeled parts. It is a playful model-inspection interaction, not a duplicate site menu or simulated diagnostic.
- Extra offset front/back rails give the radial instrument thickness. All these objects share the existing 3D camera, head-follow frame and 30 fps cap. No eye-mounted overlay was added.
- Video still preloads and autoplays on selection. Short location stories now size to their actual content; longer About/Notes content remains scrollable.

## Suit acquisition and conversion

The user's `Iron man Mark 7 armors.zip` was moved to `source-assets/mark7/iron-man-mark7.zip`, with the original `.blend`, preview and `BLENDSWAP_LICENSE.txt` preserved beside it. `provenance.json` records SHA-256 hashes. Source is **Iron man Mark 7 armors by 2iemniak**, https://blendswap.com/blend/6708.

The archive says **CC Attribution 3.0** and also explicitly marks the blend as **noncommercial fan art**. Both statements are preserved; this audit does not resolve future public/commercial use. Asset-release requirements remain a separate decision.

The Blender 2.63 file contains three material variants. `scripts/build_mark7.py` keeps the central one, evaluates mirrors, omits subdivision/split-normal modifiers, decimates, dissolves nearly coplanar geometry and keeps feature/boundary edges. Import used Blender 4.5.3 with `--factory-startup --disable-autoexec`; embedded scripts were not enabled. The initial sandbox Metal initialization crashed, so the local extraction ran outside the sandbox with the same script restrictions.

Runtime derivative: **34 parts, 5,018 vertices, 7,358 line segments, 310,438 bytes**. All parts are batched into one LineSegments draw, with one explosion uniform and exported normals for front/back intensity. It has no textures, rig, lights or subdivision at runtime. The original model is not loaded by the browser.

Rebuild with the existing local Blender executable (or another compatible installation):

```
Blender --background --factory-startup --disable-autoexec \
  'prototypes/3d-face/source-assets/mark7/mark 7 avengers 3 versions .blend' \
  --python prototypes/3d-face/scripts/build_mark7.py
```

## Verification and measured cost

- At 1280 × 720, the stage bounds exactly matched the viewport. No Source code menu button, eye marker, header/footer controls or display-setting buttons appeared in the accessible scene.
- All seven locations cycled in the requested order. Pointer scrolling selected Galway; pointer clicking opened its correct story. About contained one Source code link.
- Pointer clicking the armor separated it; keyboard rotation and reassembly worked. Its source indices and coordinates passed range/finite validation.
- No browser warning/error logs in the checked run. JS syntax, whitespace and the unchanged Face asset audit passed.
- The inspected full view reports **14 draw calls, 6,739 triangles, 11,578 line segments and 7 points**, with **518,400 framebuffer pixels** at that viewport. The extra draws/lines are the actual globe, suit and offset rails. These are workload counters, not an FPS guarantee for every device.
- Animation is event-driven and settles when the globe, head, armor and media stop changing; ordinary automatic blinks remain.

Captures: `volumetric-hud-preview.png`, `location-story-preview.png`, `armor-exploded-preview.png`.

This replaces the prior `FUNCTIONAL-HUD-TRIAL.md` presentation, whose settings and canvas globe are now historical. It remains a disposable visual prototype for #5, with the content choices relevant to #6 and the completed source audit relevant to #9.
